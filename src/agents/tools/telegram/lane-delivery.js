export function createLaneDeliveryStateTracker() {
    const state = {
        delivered: false,
        skippedNonSilent: 0,
        failedNonSilent: 0,
    };
    return {
        markDelivered: () => {
            state.delivered = true;
        },
        markNonSilentSkip: () => {
            state.skippedNonSilent += 1;
        },
        markNonSilentFailure: () => {
            state.failedNonSilent += 1;
        },
        snapshot: () => ({ ...state }),
    };
}
export function createLaneTextDeliverer(params) {
    const getLanePreviewText = (lane) => lane.lastPartialText;
    const tryUpdatePreviewForLane = async ({ lane, laneName, text, previewButtons, stopBeforeEdit = false, updateLaneSnapshot = false, skipRegressive, context, previewMessageId: previewMessageIdOverride, previewTextSnapshot, }) => {
        if (!lane.stream) {
            return false;
        }
        const lanePreviewMessageId = lane.stream.messageId();
        const hadPreviewMessage = typeof previewMessageIdOverride === "number" || typeof lanePreviewMessageId === "number";
        if (stopBeforeEdit) {
            await params.stopDraftLane(lane);
        }
        const previewMessageId = typeof previewMessageIdOverride === "number"
            ? previewMessageIdOverride
            : lane.stream.messageId();
        if (typeof previewMessageId !== "number") {
            return false;
        }
        const currentPreviewText = previewTextSnapshot ?? getLanePreviewText(lane);
        const shouldSkipRegressive = Boolean(currentPreviewText) &&
            currentPreviewText.startsWith(text) &&
            text.length < currentPreviewText.length &&
            (skipRegressive === "always" || hadPreviewMessage);
        if (shouldSkipRegressive) {
            params.markDelivered();
            return true;
        }
        try {
            await params.editPreview({
                laneName,
                messageId: previewMessageId,
                text,
                previewButtons,
                context,
            });
            if (updateLaneSnapshot) {
                lane.lastPartialText = text;
            }
            params.markDelivered();
            return true;
        }
        catch (err) {
            params.log(`telegram: ${laneName} preview ${context} edit failed; falling back to standard send (${String(err)})`);
            return false;
        }
    };
    const consumeArchivedAnswerPreviewForFinal = async ({ lane, text, payload, previewButtons, canEditViaPreview, }) => {
        const archivedPreview = params.archivedAnswerPreviews.shift();
        if (!archivedPreview) {
            return undefined;
        }
        if (canEditViaPreview) {
            const finalized = await tryUpdatePreviewForLane({
                lane,
                laneName: "answer",
                text,
                previewButtons,
                stopBeforeEdit: false,
                skipRegressive: "existingOnly",
                context: "final",
                previewMessageId: archivedPreview.messageId,
                previewTextSnapshot: archivedPreview.textSnapshot,
            });
            if (finalized) {
                return "preview-finalized";
            }
        }
        try {
            await params.deletePreviewMessage(archivedPreview.messageId);
        }
        catch (err) {
            params.log(`telegram: archived answer preview cleanup failed (${archivedPreview.messageId}): ${String(err)}`);
        }
        const delivered = await params.sendPayload(params.applyTextToPayload(payload, text));
        return delivered ? "sent" : "skipped";
    };
    return async ({ laneName, text, payload, infoKind, previewButtons, allowPreviewUpdateForNonFinal = false, }) => {
        const lane = params.lanes[laneName];
        const hasMedia = Boolean(payload.mediaUrl) || (payload.mediaUrls?.length ?? 0) > 0;
        const canEditViaPreview = !hasMedia && text.length > 0 && text.length <= params.draftMaxChars && !payload.isError;
        if (infoKind === "final") {
            if (laneName === "answer") {
                const archivedResult = await consumeArchivedAnswerPreviewForFinal({
                    lane,
                    text,
                    payload,
                    previewButtons,
                    canEditViaPreview,
                });
                if (archivedResult) {
                    return archivedResult;
                }
            }
            if (canEditViaPreview && !params.finalizedPreviewByLane[laneName]) {
                await params.flushDraftLane(lane);
                if (laneName === "answer") {
                    const archivedResultAfterFlush = await consumeArchivedAnswerPreviewForFinal({
                        lane,
                        text,
                        payload,
                        previewButtons,
                        canEditViaPreview,
                    });
                    if (archivedResultAfterFlush) {
                        return archivedResultAfterFlush;
                    }
                }
                const finalized = await tryUpdatePreviewForLane({
                    lane,
                    laneName,
                    text,
                    previewButtons,
                    stopBeforeEdit: true,
                    skipRegressive: "existingOnly",
                    context: "final",
                });
                if (finalized) {
                    params.finalizedPreviewByLane[laneName] = true;
                    return "preview-finalized";
                }
            }
            else if (!hasMedia && !payload.isError && text.length > params.draftMaxChars) {
                params.log(`telegram: preview final too long for edit (${text.length} > ${params.draftMaxChars}); falling back to standard send`);
            }
            await params.stopDraftLane(lane);
            const delivered = await params.sendPayload(params.applyTextToPayload(payload, text));
            return delivered ? "sent" : "skipped";
        }
        if (allowPreviewUpdateForNonFinal && canEditViaPreview) {
            const updated = await tryUpdatePreviewForLane({
                lane,
                laneName,
                text,
                previewButtons,
                stopBeforeEdit: false,
                updateLaneSnapshot: true,
                skipRegressive: "always",
                context: "update",
            });
            if (updated) {
                return "preview-updated";
            }
        }
        const delivered = await params.sendPayload(params.applyTextToPayload(payload, text));
        return delivered ? "sent" : "skipped";
    };
}
//# sourceMappingURL=lane-delivery.js.map