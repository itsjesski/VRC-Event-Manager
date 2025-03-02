import {
  Interaction,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
} from 'discord.js';

export const handleEditButtonInteraction = async (interaction: Interaction) => {
  if (!interaction.isButton() || interaction.customId !== 'edit') return;

  const message = interaction.message;
  const content = message.content;

  // Use the existing message content directly
  const template = content;

  const modal = new ModalBuilder()
    .setCustomId('editEventModal')
    .setTitle('Edit Event');

  const templateInput = new TextInputBuilder()
    .setCustomId('template')
    .setLabel('Event Details')
    .setStyle(TextInputStyle.Paragraph)
    .setValue(template)
    .setRequired(true);

  modal.addComponents(
    new ActionRowBuilder<TextInputBuilder>().addComponents(templateInput),
  );

  await interaction.showModal(modal);
};
