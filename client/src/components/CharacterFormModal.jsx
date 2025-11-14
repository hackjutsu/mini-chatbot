import { useEffect, useState } from 'react';

const emptyState = { name: '', prompt: '', avatarUrl: '' };

const CharacterFormModal = ({
  isOpen,
  mode = 'create',
  initialValues = emptyState,
  onSubmit,
  onCancel,
  isSubmitting,
  error,
}) => {
  const [formState, setFormState] = useState(emptyState);

  useEffect(() => {
    if (isOpen) {
      setFormState({
        name: initialValues?.name || '',
        prompt: initialValues?.prompt || '',
        avatarUrl: initialValues?.avatarUrl || '',
      });
    }
  }, [initialValues, isOpen]);

  if (!isOpen) return null;

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormState((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    onSubmit({
      name: formState.name.trim(),
      prompt: formState.prompt.trim(),
      avatarUrl: formState.avatarUrl.trim() || null,
    });
  };

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <div className="modal-panel">
        <h2>{mode === 'edit' ? 'Edit character' : 'Create character'}</h2>
        <form className="modal-form" onSubmit={handleSubmit}>
          <label htmlFor="character-name">Name</label>
          <input
            id="character-name"
            name="name"
            value={formState.name}
            onChange={handleChange}
            disabled={isSubmitting}
            required
          />
          <label htmlFor="character-prompt">Background / persona</label>
          <textarea
            id="character-prompt"
            name="prompt"
            rows={4}
            value={formState.prompt}
            onChange={handleChange}
            disabled={isSubmitting}
            required
          />
          <label htmlFor="character-avatar">Avatar URL (optional)</label>
          <input
            id="character-avatar"
            name="avatarUrl"
            value={formState.avatarUrl || ''}
            onChange={handleChange}
            disabled={isSubmitting}
            placeholder="/avatars/nova.svg"
          />
          {error ? <p className="field-error">{error}</p> : null}
          <div className="modal-actions">
            <button type="button" className="ghost" onClick={onCancel} disabled={isSubmitting}>
              Cancel
            </button>
            <button type="submit" className="primary" disabled={isSubmitting}>
              {isSubmitting ? 'Saving…' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CharacterFormModal;
