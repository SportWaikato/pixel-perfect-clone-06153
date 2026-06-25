'use client';

import { useMemo } from 'react';
import { FormikInputField, FormikSelectField, FormikSwitchField } from '@/modules/common/components/Formik';
import { SelectItem } from '@/modules/application/components/DesignSystem/ui/select';
import { Button } from '@/modules/application/components/DesignSystem/ui/button';
import { RadioGroup, RadioGroupItem } from '@/modules/application/components/DesignSystem/ui/radio-group';
import { Label } from '@/modules/application/components/DesignSystem/ui/label';
import { cn } from '@/modules/common/utils';
import {
  CRITERIA_TYPE_OPTIONS,
  PARTICIPATION_OPTIONS,
  ACTIVITY_OPTIONS,
  CRITERIA_FIELD_DEFAULTS,
  CRITERIA_STRING_FIELDS,
  getBadgeCriteriaSummary,
  type BadgeFormValues,
  type CriteriaType,
} from './badgeCriteriaHelpers';

interface BadgeCriteriaBuilderProps {
  values: BadgeFormValues;
  setFieldValue: (field: string, value: unknown, shouldValidate?: boolean) => void;
  namePrefix?: string;
}

export const BadgeCriteriaBuilder = ({ values, setFieldValue, namePrefix = '' }: BadgeCriteriaBuilderProps) => {
  const basePath = namePrefix ? `${namePrefix}.` : '';
  const fieldName = (field: keyof BadgeFormValues) => `${basePath}${field}`;

  const handleCriteriaTypeChange = (nextType: CriteriaType) => {
    if (nextType === values.criteriaType) {
      return;
    }

    setFieldValue(fieldName('criteriaType'), nextType);
    CRITERIA_STRING_FIELDS.forEach(field => {
      setFieldValue(fieldName(field), '');
    });
    setFieldValue(fieldName('includesDateRange'), false);

    const defaults = CRITERIA_FIELD_DEFAULTS[nextType];
    Object.entries(defaults).forEach(([key, value]) => {
      if (typeof value === 'undefined') {
        return;
      }
      setFieldValue(fieldName(key as keyof BadgeFormValues), value);
    });
  };

  const handleResetCriteria = () => {
    CRITERIA_STRING_FIELDS.forEach(field => {
      setFieldValue(fieldName(field), '');
    });
    setFieldValue(fieldName('includesDateRange'), false);

    const defaults = CRITERIA_FIELD_DEFAULTS[values.criteriaType];
    Object.entries(defaults).forEach(([key, value]) => {
      if (typeof value === 'undefined') {
        return;
      }
      setFieldValue(fieldName(key as keyof BadgeFormValues), value);
    });
  };

  const renderTypeSpecificFields = () => {
    switch (values.criteriaType) {
      case 'specific_activity':
        return (
          <div className="grid gap-4 md:grid-cols-2">
            <FormikSelectField
              name={fieldName('activityType')}
              label="Activity Type"
              placeholder="Select activity"
            >
              {ACTIVITY_OPTIONS.map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </FormikSelectField>
            <FormikInputField
              name={fieldName('durationMinutes')}
              type="number"
              label="Minutes Required"
              placeholder="30"
            />
          </div>
        );
      case 'social_activity':
        return (
          <div className="grid gap-4 md:grid-cols-2">
            <FormikSelectField
              name={fieldName('participationType')}
              label="Participation"
              placeholder="Select participation type"
            >
              {PARTICIPATION_OPTIONS.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </FormikSelectField>
            <FormikInputField
              name={fieldName('durationMinutes')}
              type="number"
              label="Minutes Required"
              placeholder="20"
            />
          </div>
        );
      case 'time_in_nature':
        return (
          <div className="grid gap-4 md:grid-cols-2">
            <FormikInputField
              name={fieldName('durationMinutes')}
              type="number"
              label="Minutes Required"
              placeholder="60"
            />
          </div>
        );
      case 'walk_and_talk':
        return (
          <div className="grid gap-4 md:grid-cols-3">
            <FormikSelectField
              name={fieldName('activityType')}
              label="Activity Type"
              placeholder="Select activity"
            >
              {ACTIVITY_OPTIONS.map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </FormikSelectField>
            <FormikSelectField
              name={fieldName('participationType')}
              label="Participation"
              placeholder="Select participation type"
            >
              {PARTICIPATION_OPTIONS.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </FormikSelectField>
            <FormikInputField
              name={fieldName('durationMinutes')}
              type="number"
              label="Minutes Required"
              placeholder="30"
            />
          </div>
        );
      case 'entry_count':
        return (
          <div className="grid gap-4 md:grid-cols-2">
            <FormikInputField
              name={fieldName('count')}
              type="number"
              label="Activity Entries"
              placeholder="5"
            />
          </div>
        );
      case 'total_time':
        return (
          <div className="grid gap-4 md:grid-cols-2">
            <FormikInputField
              name={fieldName('totalMinutes')}
              type="number"
              label="Total Minutes"
              placeholder="120"
            />
          </div>
        );
      case 'streak':
        return (
          <div className="grid gap-4 md:grid-cols-2">
            <FormikInputField
              name={fieldName('streakDays')}
              type="number"
              label="Streak Length (days)"
              placeholder="5"
            />
          </div>
        );
      case 'activity_variety':
        return (
          <div className="grid gap-4 md:grid-cols-2">
            <FormikInputField
              name={fieldName('varietyCount')}
              type="number"
              label="Different Activity Types"
              placeholder="5"
            />
          </div>
        );
      case 'first_challenge':
      case 'leaderboard_entry':
        return (
          <div className="rounded-md border border-gray-200 bg-gray-50 p-4 text-sm text-gray-600">
            This badge is automatically awarded; no additional configuration is required.
          </div>
        );
      default:
        return null;
    }
  };

  const criteriaSummary = useMemo(() => getBadgeCriteriaSummary(values), [values]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
        <div>
          <h4 className="text-base font-medium text-gray-900">Criteria Type</h4>
          <p className="text-sm text-gray-600">Pick how a learner will earn this badge.</p>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={handleResetCriteria}>
          Reset fields
        </Button>
      </div>

      <RadioGroup
        value={values.criteriaType}
        onValueChange={value => handleCriteriaTypeChange(value as CriteriaType)}
        className="grid gap-3 md:grid-cols-2"
      >
        {CRITERIA_TYPE_OPTIONS.map(option => {
          const isActive = values.criteriaType === option.value;
          return (
            <Label
              key={option.value}
              htmlFor={`criteria-${option.value}-${namePrefix || 'root'}`}
              className={cn(
                'flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition-colors',
                isActive
                  ? 'border-blue-500 bg-blue-50 text-blue-900'
                  : 'border-gray-200 bg-white hover:border-blue-200'
              )}
            >
              <RadioGroupItem
                value={option.value}
                id={`criteria-${option.value}-${namePrefix || 'root'}`}
                className={cn(isActive ? 'border-blue-500 text-blue-600' : '')}
              />
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-900">{option.label}</p>
                <p className="text-xs text-gray-600">{option.description}</p>
              </div>
            </Label>
          );
        })}
      </RadioGroup>

      {renderTypeSpecificFields()}

      <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-4">
        <p className="text-sm font-medium text-gray-900">Criteria Preview</p>
        <p className="mt-1 text-sm text-gray-600">{criteriaSummary}</p>
      </div>

      <div className="space-y-4">
        <FormikSwitchField
          name={fieldName('includesDateRange')}
          label="Limit to a specific date range"
          description="Learners must complete the badge between the selected dates."
        />
        {values.includesDateRange && (
          <div className="grid gap-4 md:grid-cols-2">
            <FormikInputField
              name={fieldName('dateRangeStart')}
              type="date"
              label="Start Date"
            />
            <FormikInputField
              name={fieldName('dateRangeEnd')}
              type="date"
              label="End Date"
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default BadgeCriteriaBuilder;
