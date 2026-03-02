import { Handle, Position } from '@xyflow/react';
import { Typography } from '@andes/react/typography';
import { BadgePill } from '@andes/react/badge';

const NODE_TYPE_COLORS = {
  CONVEYOR: 'brand',
  CHUTE: 'positive',
  SCANNER: 'informative',
  DIVERT: 'caution',
  MERGE: 'neutral',
};

export const WcsNode = ({ data, selected }) => {
  const color = NODE_TYPE_COLORS[data.type] || 'neutral';

  return (
    <div className={`wcs-node wcs-node--${color}${selected ? ' wcs-node--selected' : ''}`}>
      <Handle type="target" position={Position.Top} />

      <div className="wcs-node__header">
        <BadgePill color={color} hierarchy="loud" className="wcs-node__type-badge">
          {data.type || 'NODE'}
        </BadgePill>
      </div>

      <div className="wcs-node__body">
        <Typography component="p" size="xs" weight="semibold" className="wcs-node__name">
          {data.name}
        </Typography>
        {data.capacity != null && (
          <Typography component="span" size="xs" color="secondary" className="wcs-node__capacity">
            cap: {data.capacity}
          </Typography>
        )}
      </div>

      <Handle type="source" position={Position.Bottom} />
    </div>
  );
};
