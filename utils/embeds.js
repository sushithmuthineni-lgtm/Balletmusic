const { EmbedBuilder } = require('discord.js');
const config = require('../config');

function baseEmbed() {
  return new EmbedBuilder()
    .setColor(config.embedColor)
    .setFooter({ text: 'Ballet Music' })
    .setTimestamp();
}

function successEmbed(description) {
  return baseEmbed().setDescription(`${config.emojis.success} ${description}`);
}

function errorEmbed(description) {
  return baseEmbed().setColor('#e74c3c').setDescription(`${config.emojis.error} ${description}`);
}

function infoEmbed(description) {
  return baseEmbed().setDescription(`${config.emojis.music} ${description}`);
}

function msToTime(duration) {
  if (!duration || duration <= 0 || !isFinite(duration)) return 'LIVE';
  let seconds = Math.floor((duration / 1000) % 60);
  let minutes = Math.floor((duration / 1000 / 60) % 60);
  let hours = Math.floor(duration / 1000 / 60 / 60);

  seconds = seconds < 10 ? `0${seconds}` : seconds;
  minutes = hours > 0 && minutes < 10 ? `0${minutes}` : minutes;

  return hours > 0 ? `${hours}:${minutes}:${seconds}` : `${minutes}:${seconds}`;
}

function progressBar(current, total, size = 18) {
  if (!total || !isFinite(total)) return '🔴 LIVE';
  const percent = Math.min(current / total, 1);
  const filledSize = Math.round(size * percent);
  const bar = '▬'.repeat(filledSize) + '🔘' + '▬'.repeat(Math.max(size - filledSize, 0));
  return bar;
}

module.exports = { baseEmbed, successEmbed, errorEmbed, infoEmbed, msToTime, progressBar };
