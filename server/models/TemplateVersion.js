const mongoose = require('mongoose');

/**
 * TemplateVersion — Stores snapshots of template state for version history.
 * Capped at 20 versions per template (oldest pruned on save).
 * Created on every explicit "Save" action in the editor.
 */
const templateVersionSchema = new mongoose.Schema(
  {
    template: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CertificateTemplate',
      required: true,
      index: true,
    },
    /** Snapshot of the overlay array at time of save */
    overlays: {
      type: Array,
      default: [],
    },
    /** Snapshot of the pages array (multi-page templates) */
    pages: {
      type: Array,
      default: [],
    },
    /** Overlay count for quick display in version list */
    overlayCount: {
      type: Number,
      default: 0,
    },
    /** Page count for quick display */
    pageCount: {
      type: Number,
      default: 0,
    },
    /** Typography settings snapshot */
    typography: {
      type: Object,
      default: {},
    },
    /** Who triggered this save */
    savedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for efficient querying: newest first for a given template
templateVersionSchema.index({ template: 1, createdAt: -1 });

module.exports = mongoose.model('TemplateVersion', templateVersionSchema);
