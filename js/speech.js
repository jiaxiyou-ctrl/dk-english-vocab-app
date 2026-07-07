const Speech = {
  enabled: true,

  speak(text) {
    if (!this.enabled) return;
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.rate = 0.9;
    window.speechSynthesis.speak(utterance);
  },

  toggle() {
    this.enabled = !this.enabled;
    return this.enabled;
  },

  setEnabled(val) {
    this.enabled = val;
  }
};
