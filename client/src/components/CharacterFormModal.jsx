import { useEffect, useState } from 'react';

const presetAvatars = [
  { id: 'default', label: 'Grey profile', url: '/avatars/default.svg' },
  { id: 'nova', label: 'Nova', url: '/avatars/nova.svg' },
  { id: 'lumi', label: 'Chef Lumi', url: '/avatars/lumi.svg' },
  { id: 'willow', label: 'Professor Willow', url: '/avatars/willow.svg' },
  { id: 'guide', label: 'Guide', url: '/avatars/guide.svg' },
  { id: 'artisan', label: 'Artisan', url: '/avatars/artisan.svg' },
  { id: 'nebula', label: 'Nebula', url: '/avatars/nebula.svg' },
  { id: 'aurora', label: 'Aurora', url: '/avatars/aurora.svg' },
];

const buildAvatarList = (currentUrl) => {
  if (!currentUrl) return presetAvatars;
  if (presetAvatars.some((avatar) => avatar.url === currentUrl)) {
    return presetAvatars;
  }
  return [
    ...presetAvatars,
    { id: 'custom', label: 'Current avatar', url: currentUrl },
  ];
};

const emptyState = { name: '', shortDescription: '', prompt: '', avatarUrl: presetAvatars[0].url };

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
  const [avatarOptions, setAvatarOptions] = useState(presetAvatars);
  const [fieldErrors, setFieldErrors] = useState({ name: '', shortDescription: '', prompt: '' });

  useEffect(() => {
    if (isOpen) {
      const options = buildAvatarList(initialValues?.avatarUrl);
      setFormState({
        name: initialValues?.name || '',
        shortDescription: initialValues?.shortDescription || '',
        prompt: initialValues?.prompt || '',
        avatarUrl: initialValues?.avatarUrl || options[0].url,
      });
      setAvatarOptions(options);
      setFieldErrors({ name: '', shortDescription: '', prompt: '' });
    }
  }, [initialValues, isOpen]);

  if (!isOpen) return null;

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormState((prev) => ({ ...prev, [name]: value }));
    setFieldErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const errors = { name: '', shortDescription: '', prompt: '' };
    if (!formState.name.trim()) {
      errors.name = 'Name is required.';
    }
    if (!formState.shortDescription.trim()) {
      errors.shortDescription = 'Short description is required.';
    }
    if (!formState.prompt.trim()) {
      errors.prompt = 'Background is required.';
    }
    if (errors.name || errors.shortDescription || errors.prompt) {
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({ name: '', shortDescription: '', prompt: '' });
    onSubmit({
      name: formState.name.trim(),
      shortDescription: formState.shortDescription.trim(),
      prompt: formState.prompt.trim(),
      avatarUrl: formState.avatarUrl.trim() || null,
    });
  };

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <div className="modal-panel">
        <div className="modal-header">
          <h2>{mode === 'edit' ? 'Edit character' : 'Create character'}</h2>
          <button
            type="button"
            className="modal-close-btn"
            onClick={onCancel}
            aria-label="Close character modal"
            disabled={isSubmitting}
          >
            ×
          </button>
        </div>
        <form className="modal-form" onSubmit={handleSubmit}>
          <div className="modal-field">
            <label htmlFor="character-name">Name</label>
            <input
              id="character-name"
              name="name"
              value={formState.name}
              onChange={handleChange}
              disabled={isSubmitting}
              required
            />
            {fieldErrors.name ? <p className="field-error">{fieldErrors.name}</p> : null}
          </div>
          <div className="modal-field">
            <label htmlFor="character-short-description">Short description</label>
            <input
              id="character-short-description"
              name="shortDescription"
              value={formState.shortDescription}
              onChange={handleChange}
              maxLength={120}
              placeholder="One-line summary for discovery"
              disabled={isSubmitting}
              required
            />
            {fieldErrors.shortDescription ? (
              <p className="field-error">{fieldErrors.shortDescription}</p>
            ) : null}
          </div>
          <div className="modal-field">
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
            {fieldErrors.prompt ? <p className="field-error">{fieldErrors.prompt}</p> : null}
          </div>
          <div className="modal-field">
            <label htmlFor="character-prompt">Choose an avatar</label>
            <fieldset className="avatar-choices modal-field" disabled={isSubmitting}>
              {/* <legend>Choose an avatar</legend> */}
              <div className="avatar-grid">
                {avatarOptions.map((avatar) => (
                  <label
                    key={avatar.id}
                    className={`avatar-option${formState.avatarUrl === avatar.url ? ' is-selected' : ''}`}
                    aria-label={avatar.label}
                  >
                    <input
                      type="radio"
                      name="presetAvatar"
                      value={avatar.url}
                      checked={formState.avatarUrl === avatar.url}
                      onChange={(event) =>
                        setFormState((prev) => ({ ...prev, avatarUrl: event.target.value }))
                      }
                    />
                    <img src={avatar.url} alt="" aria-hidden="true" />
                    <span className="sr-only">{avatar.label}</span>
                  </label>
                ))}
              </div>
            </fieldset>
          </div>
          {error ? <p className="field-error">{error}</p> : null}
          <div className="modal-actions">
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
