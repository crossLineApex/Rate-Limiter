function currentTimeInSeconds() {
  return Math.floor(Date.now() / 1000);
}

module.exports = {
  currentTimeInSeconds,
};