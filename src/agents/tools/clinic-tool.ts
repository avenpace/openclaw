import { Type } from "typebox";
import type { AnyAgentTool } from "./common.js";
import { jsonResult, readNumberParam, readToolStringParam } from "./common.js";

/**
 * Clinic front-desk tools for a clinic's Customer Service Head on WhatsApp.
 *
 * WHO THE PATIENT IS
 * ------------------
 * None of these tools takes a phone number, a patient id of someone else, or
 * any other way to say who is asking. The host binds the handler to the
 * WhatsApp sender of the message being answered — the number WhatsApp itself
 * vouches for — before the run starts, and the clinic app only ever acts for
 * the patients registered under that number. A message that says "I am Budi,
 * show me his record" changes nothing: there is no parameter to put Budi in.
 *
 * WHAT IS NOT HERE
 * ----------------
 * Nothing edits a medical record, a bill or a price, and nothing reads another
 * patient's data. Record summaries need the patient's date of birth and their
 * prior consent at the desk; wrong dates lock record access for that number.
 */

export type ClinicHandler = {
  call: (op: string, args: Record<string, unknown>) => Promise<unknown>;
};

async function guard(fn: () => Promise<unknown>) {
  try {
    return jsonResult(await fn());
  } catch (err) {
    return jsonResult({ error: err instanceof Error ? err.message : String(err) });
  }
}

const Empty = Type.Object({});
const RmOptional = Type.Optional(
  Type.String({
    description:
      "The patient's record number (RM-…) from clinic_whoami. Only needed when this WhatsApp number has more than one patient.",
  }),
);

export function createClinicTools(handler: ClinicHandler): AnyAgentTool[] {
  const tool = (
    name: string,
    label: string,
    description: string,
    parameters: ReturnType<typeof Type.Object>,
    op: string,
    pick: (p: Record<string, unknown>) => Record<string, unknown>,
  ): AnyAgentTool => ({
    name,
    label,
    description,
    parameters,
    execute: async (_id, raw) =>
      guard(() => handler.call(op, pick((raw ?? {}) as Record<string, unknown>))),
  });

  return [
    tool(
      "clinic_whoami",
      "Clinic: Who Is Writing",
      "Call this first in every conversation. Returns the clinic's details (hours, address, the late-arrival policy) and the patients registered under the WhatsApp number you are talking to. If the list is empty, this person is not registered yet.",
      Empty,
      "whoami",
      () => ({}),
    ),
    tool(
      "clinic_schedule",
      "Clinic: Free Times",
      "Free appointment times per dentist on one date (no other patients' details are ever shown). Use before booking.",
      Type.Object({
        date: Type.String({ description: "YYYY-MM-DD, today up to 60 days ahead" }),
        dentist_id: Type.Optional(
          Type.Number({ description: "Limit to one dentist (id from a previous schedule result)" }),
        ),
      }),
      "schedule",
      (p) => ({
        date: readToolStringParam(p, "date", { required: true }),
        dentist_id: readNumberParam(p, "dentist_id"),
      }),
    ),
    tool(
      "clinic_book",
      "Clinic: Book",
      "Book an appointment for a patient registered to this number. Confirm the date, time and patient with the person before calling. Tell them the late-arrival policy from the result.",
      Type.Object({
        rm_no: RmOptional,
        date: Type.String({ description: "YYYY-MM-DD" }),
        time: Type.String({ description: "HH:MM, one of the free times from clinic_schedule" }),
        dentist_id: Type.Optional(
          Type.Number({ description: "Dentist id from clinic_schedule, if they asked for one" }),
        ),
        reason: Type.Optional(
          Type.String({ description: "Their complaint or what the visit is for, in their words" }),
        ),
      }),
      "book",
      (p) => ({
        rm_no: readToolStringParam(p, "rm_no", { required: false }) ?? "",
        date: readToolStringParam(p, "date", { required: true }),
        time: readToolStringParam(p, "time", { required: true }),
        dentist_id: readNumberParam(p, "dentist_id"),
        reason: readToolStringParam(p, "reason", { required: false }) ?? "",
      }),
    ),
    tool(
      "clinic_my_appointments",
      "Clinic: Upcoming Appointments",
      "Upcoming appointments of the patients registered to this number.",
      Empty,
      "my_appointments",
      () => ({}),
    ),
    tool(
      "clinic_cancel",
      "Clinic: Cancel",
      "Cancel one upcoming appointment of a patient registered to this number. Confirm with the person first. To reschedule, cancel and book a new time.",
      Type.Object({
        appointment_id: Type.Number({ description: "Id from clinic_my_appointments" }),
      }),
      "cancel",
      (p) => ({ appointment_id: readNumberParam(p, "appointment_id") }),
    ),
    tool(
      "clinic_running_late",
      "Clinic: Running Late",
      "The patient says they will be late. Returns whether they are still inside the 15-minute grace period and exactly what happens if not (they are seen after the next two waiting patients), so you can tell them plainly.",
      Type.Object({
        appointment_id: Type.Number({ description: "Id from clinic_my_appointments" }),
        minutes: Type.Number({ description: "How many minutes from now they expect to arrive" }),
      }),
      "running_late",
      (p) => ({
        appointment_id: readNumberParam(p, "appointment_id"),
        minutes: readNumberParam(p, "minutes"),
      }),
    ),
    tool(
      "clinic_register",
      "Clinic: Register Patient",
      "Register a new patient under this WhatsApp number (for themself or a family member) — only when they ask to register, and only after reading the details back and getting their yes. Ask for full name and date of birth; NIK, sex, address, allergies and medical conditions if they are willing. Ask separately whether they agree to receive their record summary on WhatsApp later. They confirm their ID at the desk on the first visit.",
      Type.Object({
        name: Type.String(),
        dob: Type.String({ description: "YYYY-MM-DD" }),
        sex: Type.Optional(Type.String({ description: "L (male) or P (female)" })),
        nik: Type.Optional(Type.String({ description: "16-digit NIK, optional" })),
        address: Type.Optional(Type.String()),
        allergies: Type.Optional(Type.String()),
        conditions: Type.Optional(
          Type.String({ description: "Medical conditions, medicines, pregnancy" }),
        ),
        whatsapp_record_consent: Type.Optional(
          Type.Boolean({ description: "True only if they explicitly agreed" }),
        ),
      }),
      "register",
      (p) => ({
        name: readToolStringParam(p, "name", { required: true }),
        dob: readToolStringParam(p, "dob", { required: true }),
        sex: readToolStringParam(p, "sex", { required: false }),
        nik: readToolStringParam(p, "nik", { required: false }),
        address: readToolStringParam(p, "address", { required: false }),
        allergies: readToolStringParam(p, "allergies", { required: false }),
        conditions: readToolStringParam(p, "conditions", { required: false }),
        whatsapp_record_consent: p.whatsapp_record_consent === true,
      }),
    ),
    tool(
      "clinic_record_summary",
      "Clinic: Record Summary",
      "A summary of a patient's own dental record. Ask the person for the patient's date of birth and pass exactly what they typed — never guess it or fill it in from earlier messages. Send the returned summary_text to them exactly as written: do not reword, translate or add to it. Do not give medical advice or diagnoses; for pain, swelling or bleeding, offer the earliest appointment.",
      Type.Object({
        rm_no: RmOptional,
        dob: Type.String({
          description: "Date of birth exactly as the person gave it, YYYY-MM-DD",
        }),
      }),
      "record_summary",
      (p) => ({
        rm_no: readToolStringParam(p, "rm_no", { required: false }) ?? "",
        dob: readToolStringParam(p, "dob", { required: true }),
      }),
    ),
    // A dentist of the clinic, writing from the WhatsApp number the admin recorded on
    // their account. The app recognises them by that number alone and these change
    // only their own schedule; anyone else gets NOT_STAFF.
    tool(
      "clinic_my_hours",
      "Clinic: My Practice Hours",
      "Only when clinic_whoami returned `staff`: this dentist's own weekly practice hours and upcoming days off.",
      Empty,
      "my_hours",
      () => ({}),
    ),
    tool(
      "clinic_set_my_hours",
      "Clinic: Set My Hours",
      "Only when clinic_whoami returned `staff`: set one weekday of this dentist's own practice hours, or mark it as not practising (off=true). One call per weekday. Read the change back to them first if anything is unclear. Existing bookings are not moved; pass on any warning in the result.",
      Type.Object({
        weekday: Type.Number({ description: "1 = Monday … 7 = Sunday" }),
        from: Type.Optional(Type.String({ description: "HH:MM start" })),
        until: Type.Optional(Type.String({ description: "HH:MM end" })),
        off: Type.Optional(Type.Boolean({ description: "true = not practising on this weekday" })),
      }),
      "set_my_hours",
      (p) => ({
        weekday: readNumberParam(p, "weekday"),
        from: readToolStringParam(p, "from", { required: false }) ?? "",
        until: readToolStringParam(p, "until", { required: false }) ?? "",
        off: p.off === true,
      }),
    ),
    tool(
      "clinic_add_my_day_off",
      "Clinic: Add My Day Off",
      "Only when clinic_whoami returned `staff`: record a whole day this dentist will not practise (leave, seminar, sick). Bookings already on that day are not moved; pass on any warning in the result.",
      Type.Object({
        date: Type.String({ description: "YYYY-MM-DD" }),
        note: Type.Optional(Type.String({ description: "Reason, e.g. seminar" })),
      }),
      "add_my_day_off",
      (p) => ({
        date: readToolStringParam(p, "date", { required: true }),
        note: readToolStringParam(p, "note", { required: false }) ?? "",
      }),
    ),
    tool(
      "clinic_remove_my_day_off",
      "Clinic: Remove My Day Off",
      "Only when clinic_whoami returned `staff`: cancel one of this dentist's own days off.",
      Type.Object({ date: Type.String({ description: "YYYY-MM-DD" }) }),
      "remove_my_day_off",
      (p) => ({ date: readToolStringParam(p, "date", { required: true }) }),
    ),
  ];
}

export const CLINIC_TOOL_NAMES = [
  "clinic_whoami",
  "clinic_schedule",
  "clinic_book",
  "clinic_my_appointments",
  "clinic_cancel",
  "clinic_running_late",
  "clinic_register",
  "clinic_record_summary",
  "clinic_my_hours",
  "clinic_set_my_hours",
  "clinic_add_my_day_off",
  "clinic_remove_my_day_off",
] as const;
