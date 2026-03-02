import { getI18n } from 'nordic/i18n';
import { Button } from '@andes/react/button';
import { Typography } from '@andes/react/typography';

const NODE_TYPES = [
  { type: 'CONVEYOR', label: 'Conveyor' },
  { type: 'CHUTE', label: 'Chute' },
  { type: 'SCANNER', label: 'Scanner' },
  { type: 'DIVERT', label: 'Divert' },
  { type: 'MERGE', label: 'Merge' },
];

const onDragStart = (event, nodeType) => {
  event.dataTransfer.setData('application/wcs-node-type', nodeType);
  event.dataTransfer.effectAllowed = 'copy';
};

export const LeftPalette = () => {
  const i18n = getI18n();

  return (
    <aside className="left-palette" aria-label={i18n.gettext('Node palette')}>
      <Typography component="p" size="xs" weight="semibold" className="left-palette__title">
        {i18n.gettext('Nodes')}
      </Typography>

      <ul className="left-palette__list">
        {NODE_TYPES.map(({ type, label }) => (
          <li key={type}>
            <Button
              hierarchy="mute"
              size="small"
              className={`left-palette__item left-palette__item--${type.toLowerCase()}`}
              aria-label={i18n.gettext('Add {0} node to canvas', label)}
              draggable
              onDragStart={(e) => onDragStart(e, type)}
              onClick={() =>
                document.dispatchEvent(new CustomEvent('wcs:add-node', { detail: { type } }))
              }
            >
              <Typography component="span" size="xs">
                {label}
              </Typography>
            </Button>
          </li>
        ))}
      </ul>

      <Typography component="p" size="xs" color="secondary" className="left-palette__hint">
        {i18n.gettext('Drag nodes onto the canvas')}
      </Typography>
    </aside>
  );
};
