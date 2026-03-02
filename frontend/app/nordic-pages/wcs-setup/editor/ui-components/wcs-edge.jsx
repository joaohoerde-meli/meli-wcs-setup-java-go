import { BaseEdge, EdgeLabelRenderer, getBezierPath } from '@xyflow/react';

export const WcsEdge = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  selected,
}) => {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const label =
    data?.distance_m != null ? `${data.distance_m}m` : '';

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        className={`wcs-edge${selected ? ' wcs-edge--selected' : ''}`}
      />
      {label && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              pointerEvents: 'all',
            }}
            className="wcs-edge__label nodrag nopan"
          >
            {label}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
};
