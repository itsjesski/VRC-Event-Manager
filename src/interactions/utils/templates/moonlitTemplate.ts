export function getMoonlitTemplate(
    startTimeUnix: string,
    dj: string,
    leader: string | null,
    slotList: string,
  ) {
    const template = `**LAYER.// Moonlit EU/NA**

**Details:**
- The event starts on <t:${startTimeUnix}:F>.
- There are 4 slots with 5 people per slot.
${leader ? `- The leader of this event is ${leader}.` : ''}
- Each slot lasts 15 minutes.

**Slot Times:**
[${dj}]
${slotList}
`.trim();
  
    return template;
  }