import { useState, useMemo } from 'react';
import { Formik, Form } from 'formik';
import * as yup from 'yup';
import { Plus, Edit2, Trash2, Calendar, Monitor } from 'lucide-react';
import { Link } from '@tanstack/react-router';
import { toast } from 'sonner';
import { SchoolTermInterface } from '@/models/terms/interfaces/SchoolTermInterface';
import { SchoolTermService } from '@/models/terms/services/SchoolTermService';
import { UserInterface } from '@/models/users/interfaces/UserInterface';
import { createSupabaseClient } from '@/models/supabase/services/SupabaseClient';
import { notifyAboutError } from '@/modules/application/utils/notifyAboutError';
import { Button } from '@/modules/application/components/DesignSystem/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/modules/application/components/DesignSystem/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/modules/application/components/DesignSystem/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/modules/application/components/DesignSystem/ui/alert-dialog';
import { FormikInputField, FormikSelectField } from '@/modules/common/components/Formik';
import { SelectItem } from '@/modules/application/components/DesignSystem/ui/select';

interface TermManagementContentProps {
  terms: SchoolTermInterface[];
  schoolId: string;
  currentUser: UserInterface;
}

const termSchema = yup.object().shape({
  term_number: yup.number().oneOf([1, 2, 3, 4]).required('Term number is required'),
  start_date: yup.string().required('Start date is required'),
  end_date: yup
    .string()
    .required('End date is required')
    .test('after-start', 'End date must be after start date', function (value) {
      return !this.parent.start_date || !value || value > this.parent.start_date;
    }),
});

const CURRENT_YEAR = new Date().getFullYear();

const TermManagementContent = ({ terms: initialTerms, schoolId, currentUser }: TermManagementContentProps) => {
  const [terms, setTerms] = useState<SchoolTermInterface[]>(initialTerms);
  const [editingTerm, setEditingTerm] = useState<SchoolTermInterface | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedYear, setSelectedYear] = useState<number>(CURRENT_YEAR);
  const [initialTermNumber, setInitialTermNumber] = useState<1 | 2 | 3 | 4>(1);

  const availableYears = useMemo(() => {
    const fromTerms = terms.map(t => t.year);
    const yearsSet = new Set([CURRENT_YEAR - 1, CURRENT_YEAR, CURRENT_YEAR + 1, ...fromTerms]);
    return Array.from(yearsSet).sort((a, b) => b - a);
  }, [terms]);

  const termsForYear = useMemo(
    () => terms.filter(t => t.year === selectedYear),
    [terms, selectedYear],
  );

  const termByNumber = (n: 1 | 2 | 3 | 4) => termsForYear.find(t => t.term_number === n) ?? null;

  const handleSubmit = async (values: {
    term_number: number;
    start_date: string;
    end_date: string;
  }) => {
    const supabase = createSupabaseClient();
    const service = new SchoolTermService(supabase);

    try {
      if (editingTerm) {
        const updated = await service.update(editingTerm.id, {
          start_date: values.start_date,
          end_date: values.end_date,
        });
        setTerms(prev => prev.map(t => (t.id === updated.id ? updated : t)));
        toast.success('Term updated');
      } else {
        const created = await service.create({
          school_id: schoolId,
          year: selectedYear,
          term_number: Number(values.term_number) as 1 | 2 | 3 | 4,
          start_date: values.start_date,
          end_date: values.end_date,
          created_by: currentUser.id,
        });
        setTerms(prev => [...prev, created]);
        toast.success('Term created');
      }
      setDialogOpen(false);
      setEditingTerm(null);
    } catch (error) {
      notifyAboutError(error);
    }
  };

  const handleDelete = async (term: SchoolTermInterface) => {
    const supabase = createSupabaseClient();
    const service = new SchoolTermService(supabase);
    try {
      await service.delete(term.id);
      setTerms(prev => prev.filter(t => t.id !== term.id));
      toast.success('Term deleted');
    } catch (error) {
      notifyAboutError(error);
    }
  };

  const openCreate = (termNumber: 1 | 2 | 3 | 4) => {
    setEditingTerm(null);
    setInitialTermNumber(termNumber);
    setDialogOpen(true);
  };

  const openEdit = (term: SchoolTermInterface) => {
    setEditingTerm(term);
    setDialogOpen(true);
  };

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('en-NZ', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Pacific/Auckland' });

  const TermCard = ({ termNumber }: { termNumber: 1 | 2 | 3 | 4 }) => {
    const term = termByNumber(termNumber);
    const isActive = term ? SchoolTermService.isActive(term) : false;
    const currentWeek = term && isActive ? SchoolTermService.getCurrentWeekNumber(term) : null;
    const totalWeeks = term ? SchoolTermService.getTotalWeeks(term) : null;

    return (
      <div className="rounded-2xl border border-gray-100 bg-white shadow-sm flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-gray-400" />
            <span className="font-semibold text-gray-900">Term {termNumber}</span>
          </div>
          {isActive && (
            <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
              <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
              Active
            </span>
          )}
        </div>

        <div className="flex-1 px-5 py-4">
          {term ? (
            <div className="space-y-1">
              <p className="text-sm text-gray-700">
                {formatDate(term.start_date)} – {formatDate(term.end_date)}
              </p>
              <p className="text-xs text-gray-400">{totalWeeks} weeks</p>
              {currentWeek && (
                <p className="text-xs font-medium text-[#00ACEF]">Week {currentWeek} of {totalWeeks}</p>
              )}
            </div>
          ) : (
            <p className="text-sm text-gray-400 italic">Not configured</p>
          )}
        </div>

        <div className="flex gap-2 px-5 py-3 border-t border-gray-50">
          {term ? (
            <>
              <Button
                size="sm"
                variant="outline"
                className="flex-1 gap-1"
                onClick={() => openEdit(term)}
              >
                <Edit2 className="h-3.5 w-3.5" /> Edit
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button size="sm" variant="outline" className="text-red-500 hover:text-red-600 hover:border-red-300">
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Term {termNumber}?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will remove Term {termNumber} {selectedYear} from this school. Assembly period data will no longer reference this term.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      className="bg-red-600 hover:bg-red-700"
                      onClick={() => handleDelete(term)}
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </>
          ) : (
            <Button
              size="sm"
              variant="outline"
              className="flex-1 gap-1"
              onClick={() => openCreate(termNumber)}
            >
              <Plus className="h-3.5 w-3.5" /> Add Term {termNumber}
            </Button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">School Settings</h1>
          <p className="mt-1 text-sm text-gray-500">Manage competition terms and school configuration.</p>
        </div>
        <Button asChild className="gap-2 bg-[#0B4B39] hover:bg-[#0a3f30]">
          <Link to={`/admin/assembly${schoolId ? `?schoolId=${schoolId}` : ''}`}>
            <Monitor className="h-4 w-4" /> Assembly Mode
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-base font-semibold">Competition Terms</CardTitle>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">Year:</span>
            <select
              value={selectedYear}
              onChange={e => setSelectedYear(Number(e.target.value))}
              className="rounded-md border border-gray-200 bg-white px-3 py-1.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-[#00ACEF]"
            >
              {availableYears.map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {([1, 2, 3, 4] as const).map(n => (
              <TermCard key={n} termNumber={n} />
            ))}
          </div>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={open => { setDialogOpen(open); if (!open) setEditingTerm(null); }}>
        <DialogTrigger asChild><span /></DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingTerm ? `Edit Term ${editingTerm.term_number} ${selectedYear}` : `Add Term ${initialTermNumber} ${selectedYear}`}
            </DialogTitle>
          </DialogHeader>
          <Formik
            enableReinitialize
            initialValues={{
              term_number: editingTerm?.term_number ?? initialTermNumber,
              start_date: editingTerm?.start_date ?? '',
              end_date: editingTerm?.end_date ?? '',
            }}
            validationSchema={termSchema}
            validateOnBlur={false}
            onSubmit={handleSubmit}
          >
            {({ isSubmitting }) => (
              <Form className="space-y-4">
                {!editingTerm && (
                  <FormikSelectField name="term_number" label="Term">
                    <SelectItem value="1">Term 1</SelectItem>
                    <SelectItem value="2">Term 2</SelectItem>
                    <SelectItem value="3">Term 3</SelectItem>
                    <SelectItem value="4">Term 4</SelectItem>
                  </FormikSelectField>
                )}
                <FormikInputField name="start_date" label="Start Date" type="date" />
                <FormikInputField name="end_date" label="End Date" type="date" />
                <Button type="submit" disabled={isSubmitting} className="w-full bg-[#0B4B39] hover:bg-[#0a3f30]">
                  {isSubmitting ? 'Saving…' : editingTerm ? 'Save Changes' : 'Create Term'}
                </Button>
              </Form>
            )}
          </Formik>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TermManagementContent;
