const DPTR_TO_ENGINE = {
  '→PC': 'planDrafted',
  '→PR': 'planRevised',
  '→NR': 'needsRevision',
  '→PA': 'planAccepted',
  '→RC': 'redComplete',
  '→GC': 'greenComplete',
  '→RTC': 'refactorTestsComplete',
  '→RIC': 'refactorImplComplete',
  '→TO': 'timeout',
  '→EX': 'exception',
  '→BL': 'blocked'
};

function mapStatus(code) {
  return DPTR_TO_ENGINE[code] || code;
}

module.exports = { mapStatus, DPTR_TO_ENGINE };
