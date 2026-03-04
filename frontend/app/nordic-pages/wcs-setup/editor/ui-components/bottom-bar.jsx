import { getI18n } from 'nordic/i18n';
import { Typography } from '@andes/react/typography';
import Warning from '@andes/react/icons/Warning';
import Success from '@andes/react/icons/CheckCircle';

export const BottomBar = ({ errors }) => {
  const i18n = getI18n();
  const hasErrors = errors && errors.length > 0;

  return (
    <div
      className={`bottom-bar${hasErrors ? ' bottom-bar--has-errors' : ' bottom-bar--ok'}`}
      aria-live="polite"
      role="status"
    >
      {hasErrors ? (
        <div className="bottom-bar__errors">
          <Warning size="xtiny" color="caution" />
          <Typography component="span" size="xs" color="caution">
            {i18n.gettext('{0} validation error(s):', errors.length)}
          </Typography>
          <ul className="bottom-bar__error-list">
            {errors.map((err) => (
              <li key={err} className="bottom-bar__error-item">
                {err}
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <div className="bottom-bar__ok">
          <Success size="xtiny" color="positive" />
          <Typography component="span" size="xs" color="secondary">
            {i18n.gettext('Topology looks good')}
          </Typography>
        </div>
      )}
    </div>
  );
};
