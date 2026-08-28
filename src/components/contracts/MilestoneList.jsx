import { useState, useCallback } from 'react';
import { Layers, Plus, GripVertical, Save, X } from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { restrictToVerticalAxis, restrictToParentElement } from '@dnd-kit/modifiers';
import Card, { CardHeader, CardBody } from '../ui/Card';
import Button from '../ui/Button';
import EmptyState from '../common/EmptyState';
import MilestoneProgress from './MilestoneProgress';
import MilestoneCard from './MilestoneCard';

/**
 * Milestones section with drag-to-reorder for employers on active contracts.
 * Freelancers see a read-only ordered list.
 */
export default function MilestoneList({
  contract,
  role = 'freelancer',
  busyAction = null,
  canAdd = false,
  onAddMilestone,
  onMilestoneAction,
  onReorder,
}) {
  const milestones = contract.milestones ?? [];
  const summary = contract.summary;
  const contractActive = contract.status === 'active';
  const isEmployerView = role === 'employer';

  // Drag-to-reorder state
  const [isReordering, setIsReordering] = useState(false);
  const [orderedMilestones, setOrderedMilestones] = useState(milestones);
  const [hasChanges, setHasChanges] = useState(false);

  // Sync ordered milestones when contract milestones change
  const displayMilestones = isReordering ? orderedMilestones : milestones;

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  // Handle drag end
  const handleDragEnd = useCallback(
    (event) => {
      const { active, over } = event;
      if (active.id !== over?.id) {
        const oldIndex = orderedMilestones.findIndex((m) => m.id === active.id);
        const newIndex = orderedMilestones.findIndex((m) => m.id === over.id);
        const newOrder = arrayMove(orderedMilestones, oldIndex, newIndex);
        setOrderedMilestones(newOrder);
        setHasChanges(true);
      }
    },
    [orderedMilestones],
  );

  // Start reordering
  const startReorder = () => {
    setOrderedMilestones([...milestones]);
    setIsReordering(true);
    setHasChanges(false);
  };

  // Cancel reordering
  const cancelReorder = () => {
    setIsReordering(false);
    setOrderedMilestones(milestones);
    setHasChanges(false);
  };

  // Save new order
  const saveReorder = async () => {
    if (!hasChanges) return;
    const milestoneIds = orderedMilestones.map((m) => m.id);
    await onReorder?.(milestoneIds);
    setIsReordering(false);
    setHasChanges(false);
  };

  const progressLabel =
    summary?.milestonesCount != null
      ? `${summary.completedMilestonesCount ?? 0} of ${summary.milestonesCount} milestones completed`
      : 'Milestone progress';

  return (
    <Card>
      <CardHeader
        title="Milestones"
        description={
          summary?.milestonesCount != null
            ? `${summary.milestonesCount} milestone${summary.milestonesCount === 1 ? '' : 's'} on this contract`
            : 'Track progress on this contract'
        }
        action={
          <div className="flex items-center gap-2">
            {/* Reorder button (employer only, active contract, multiple milestones) */}
            {isEmployerView && contractActive && milestones.length > 1 && !isReordering && (
              <Button size="sm" variant="outline" onClick={startReorder}>
                <GripVertical className="h-4 w-4" /> Reorder
              </Button>
            )}

            {/* Reorder controls */}
            {isReordering && (
              <>
                <Button
                  size="sm"
                  variant="success"
                  onClick={saveReorder}
                  disabled={!hasChanges}
                >
                  <Save className="h-4 w-4" /> Save Order
                </Button>
                <Button size="sm" variant="ghost" onClick={cancelReorder}>
                  <X className="h-4 w-4" /> Cancel
                </Button>
              </>
            )}

            {/* Add Milestone button */}
            {canAdd && !isReordering && (
              <Button size="sm" onClick={onAddMilestone}>
                <Plus className="h-4 w-4" aria-hidden="true" /> Add Milestone
              </Button>
            )}
          </div>
        }
      />
      <CardBody className="space-y-5">
        {/* Reorder mode indicator */}
        {isReordering && (
          <div className="rounded-xl border border-brand-200 bg-brand-50 px-4 py-3 text-sm text-brand-700 flex items-center gap-2">
            <GripVertical className="h-4 w-4" />
            <span className="font-medium">Drag milestones to reorder them. Click "Save Order" when done.</span>
          </div>
        )}

        {summary?.progressPercent != null && (
          <MilestoneProgress percent={summary.progressPercent} label={progressLabel} />
        )}

        {displayMilestones.length === 0 ? (
          <EmptyState
            icon={Layers}
            title="No milestones have been created for this contract yet"
            description={
              isEmployerView
                ? 'Add milestones to break the work into paid checkpoints. Milestones can only be added while the contract is active.'
                : 'Once the employer adds milestones, their progress and statuses will appear here.'
            }
            action={
              canAdd ? (
                <Button size="sm" onClick={onAddMilestone}>
                  <Plus className="h-4 w-4" aria-hidden="true" /> Add Milestone
                </Button>
              ) : undefined
            }
          />
        ) : isReordering ? (
          // Sortable list (employer reordering mode)
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
            modifiers={[restrictToVerticalAxis]}
          >
            <SortableContext
              items={orderedMilestones.map((m) => m.id)}
              strategy={verticalListSortingStrategy}
            >
              <ul className="space-y-3">
                {orderedMilestones.map((milestone) => (
                  <li key={milestone.id}>
                    <MilestoneCard
                      milestone={milestone}
                      role={role}
                      contractId={contract.id}
                      contractActive={contractActive}
                      busy={
                        busyAction === milestone.id ||
                        (Array.isArray(busyAction) && busyAction.includes(milestone.id))
                      }
                      onAction={onMilestoneAction}
                      dragEnabled={true}
                    />
                  </li>
                ))}
              </ul>
            </SortableContext>
          </DndContext>
        ) : (
          // Normal read-only list
          <ul className="space-y-3">
            {displayMilestones.map((milestone) => (
              <li key={milestone.id}>
                <MilestoneCard
                  milestone={milestone}
                  role={role}
                  contractId={contract.id}
                  contractActive={contractActive}
                  busy={
                    busyAction === milestone.id ||
                    (Array.isArray(busyAction) && busyAction.includes(milestone.id))
                  }
                  onAction={onMilestoneAction}
                  dragEnabled={false}
                />
              </li>
            ))}
          </ul>
        )}
      </CardBody>
    </Card>
  );
}
