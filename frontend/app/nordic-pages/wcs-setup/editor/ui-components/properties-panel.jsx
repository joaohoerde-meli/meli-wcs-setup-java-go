import { getI18n } from 'nordic/i18n';
import { Typography } from '@andes/react/typography';
import { TextField } from '@andes/react/textfield';
import { Button } from '@andes/react/button';
import Delete from '@andes/react/icons/Delete';

export const PropertiesPanel = ({ node, edge, onUpdateNode, onUpdateEdge, onDelete }) => {
  const i18n = getI18n();

  return (
    <aside className="properties-panel" aria-label={i18n.gettext('Properties')}>
      <div className="properties-panel__header">
        <Typography component="h3" size="s" weight="semibold">
          {node ? i18n.gettext('Node') : i18n.gettext('Edge')}
        </Typography>
        <Button
          hierarchy="quiet"
          size="small"
          onClick={onDelete}
          icon={{ left: <Delete size="xtiny" /> }}
          srLabel={i18n.gettext('Delete selected')}
        >
          {i18n.gettext('Delete')}
        </Button>
      </div>

      {node && (
        <div className="properties-panel__fields">
          <TextField
            label={i18n.gettext('Node ID')}
            value={node.data.id}
            readonly
            size="small"
          />
          <TextField
            label={i18n.gettext('Name')}
            value={node.data.name || ''}
            size="small"
            onChange={(e) => onUpdateNode(node.id, { name: e.target.value })}
          />
          <TextField
            label={i18n.gettext('Type')}
            value={node.data.type || ''}
            size="small"
            placeholder={i18n.gettext('CONVEYOR, CHUTE, SCANNER…')}
            onChange={(e) => onUpdateNode(node.id, { type: e.target.value })}
          />
          <TextField
            label={i18n.gettext('Capacity')}
            value={node.data.capacity ?? ''}
            type="number"
            min="0"
            size="small"
            onChange={(e) =>
              onUpdateNode(node.id, { capacity: e.target.value === '' ? null : Number(e.target.value) })
            }
          />
        </div>
      )}

      {edge && (
        <div className="properties-panel__fields">
          <TextField
            label={i18n.gettext('Edge ID')}
            value={edge.id}
            readonly
            size="small"
          />
          <TextField
            label={i18n.gettext('Source → Target')}
            value={`${edge.source} → ${edge.target}`}
            readonly
            size="small"
          />
          <TextField
            label={i18n.gettext('Distance (m)')}
            value={edge.data?.distance_m ?? ''}
            type="number"
            min="0"
            size="small"
            onChange={(e) =>
              onUpdateEdge(edge.id, {
                distance_m: e.target.value === '' ? null : Number(e.target.value),
              })
            }
          />
          <TextField
            label={i18n.gettext('Max throughput (TU/min)')}
            value={edge.data?.max_throughput_tu_per_min ?? ''}
            type="number"
            min="1"
            size="small"
            onChange={(e) =>
              onUpdateEdge(edge.id, {
                max_throughput_tu_per_min:
                  e.target.value === '' ? null : Number(e.target.value),
              })
            }
          />
        </div>
      )}
    </aside>
  );
};
