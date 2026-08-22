import { Layers, Plus } from 'lucide-react';
import Card, { CardHeader, CardBody } from '../ui/Card';
import Button from '../ui/Button';
import EmptyState from '../common/EmptyState';
import MilestoneProgress from './MilestoneProgress';
import MilestoneCard from './MilestoneCard';

/**
 * Milestones section for the contract details page: overall progress, then
 * each milestone with role-appropriate actions. The employer gets an "Add
 * milestone" button on active contracts; the empty state is shown only when
 * the backend confirms there are no milestones.
 */
export default function MilestoneList({
  contract,
  role = 'freelancer',
  busyAction = null,
  canAdd = false,
  onAddMilestone,
  onMilestoneAction,
}) {
  const milestones = contract.milestones ?? [];
  const summary = contract.summary;
  const contractActive = contract.status === 'active';

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
          canAdd ? (
            <Button size="sm" onClick={onAddMilestone}>
              <Plus className="h-4 w-4" aria-hidden="true" /> Add Milestone
            </Button>
          ) : undefined
        }
      />
      <CardBody className="space-y-5">
        {summary?.progressPercent != null && (
          <MilestoneProgress percent={summary.progressPercent} label={progressLabel} />
        )}

        {milestones.length === 0 ? (
          <EmptyState
            icon={Layers}
            title="No milestones have been created for this contract yet"
            description={
              role === 'employer'
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
        ) : (
          <ul className="space-y-3">
            {milestones.map((milestone) => (
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
                />
              </li>
            ))}
          </ul>
        )}
      </CardBody>
    </Card>
  );
}
