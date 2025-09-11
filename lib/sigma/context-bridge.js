function buildCtx({ module, designPath, planPath, interfaceSignature, session = {} }) {
  return {
    module,
    designPath,
    planPath,
    interfaceSignature,
    session: {
      sid: session.sid || null,
      cycle: session.cycle ?? null,
      phase: session.phase || null,
      round: session.round ?? null
    }
  };
}

function toHandoff({ from, to, task, context, metadata = {} }) {
  return {
    from,
    to,
    task: {
      type: task?.type || 'general',
      purpose: task?.purpose || 'unspecified',
      parameters: task?.parameters || {}
    },
    context,
    metadata: { ...metadata, timestamp: metadata.timestamp || new Date().toISOString() }
  };
}

module.exports = { buildCtx, toHandoff };
