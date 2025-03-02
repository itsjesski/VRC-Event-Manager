export function getEventTemplate(
  eventTitle: string,
  startTimeUnix: string,
  slots: number,
  peoplePerSlot: number,
  slotsPerPerson: number,
  duration: number,
  description: string,
  slotList: string,
) {
  const template = `
    **::OPERATION:: ${eventTitle}**
${description ? `\n${description}\n` : ''}

**Details:**
- The event starts on <t:${startTimeUnix}:F>.
- There are ${slots} slots with ${peoplePerSlot} people per slot.
- Each person can sign up for ${slotsPerPerson} slots.
- Each slot lasts ${duration} minutes.

**Slot Times:**
${"``DJ``"}
${slotList}
`.trim();

  return template;
}
