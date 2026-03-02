import { getI18n } from 'nordic/i18n';
import { Button } from '@andes/react/button';
import { Typography } from '@andes/react/typography';
import Save from '@andes/react/icons/Check';
import Download from '@andes/react/icons/Download';
import Settings from '@andes/react/icons/Settings';
import Warning from '@andes/react/icons/Warning';

export const TopToolbar = ({
  saving,
  saveError,
  isNew,
  onSave,
  onValidate,
  onExport,
  onSettings,
}) => {
  const i18n = getI18n();

  return (
    <div className="top-toolbar" role="toolbar" aria-label={i18n.gettext('Editor toolbar')}>
      <div className="top-toolbar__actions">
        <Button
          hierarchy="loud"
          size="small"
          loading={saving}
          onClick={onSave}
          icon={{ left: <Save size="xtiny" /> }}
        >
          {saving
            ? i18n.gettext('Saving…')
            : isNew
              ? i18n.gettext('Create')
              : i18n.gettext('Save')}
        </Button>

        <Button
          hierarchy="quiet"
          size="small"
          onClick={onValidate}
        >
          {i18n.gettext('Validate')}
        </Button>

        <Button
          hierarchy="quiet"
          size="small"
          onClick={onExport}
          icon={{ left: <Download size="xtiny" /> }}
        >
          {i18n.gettext('Export JSON')}
        </Button>

        <Button
          hierarchy="quiet"
          size="small"
          onClick={onSettings}
          icon={{ left: <Settings size="xtiny" /> }}
        >
          {i18n.gettext('Settings')}
        </Button>
      </div>

      {saveError && (
        <div className="top-toolbar__error" role="alert">
          <Warning size="xtiny" color="negative" />
          <Typography component="span" size="xs" color="negative">
            {saveError}
          </Typography>
        </div>
      )}
    </div>
  );
};
