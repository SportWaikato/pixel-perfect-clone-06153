
import { useState, useEffect } from 'react';
import { Formik, Form } from 'formik';
import { object, number, string } from 'yup';
import { UserInterface } from '@/models/users/interfaces/UserInterface';
import { KooreroVoteInterface, INTEREST_LEVELS } from '@/models/koorero/interfaces/KooreroVoteInterface';
import { Card, CardContent, CardHeader, CardTitle } from '@/modules/application/components/DesignSystem/ui/card';
import { Button } from '@/modules/application/components/DesignSystem/ui/button';
import { RadioGroup, RadioGroupItem } from '@/modules/application/components/DesignSystem/ui/radio-group';
import { Label } from '@/modules/application/components/DesignSystem/ui/label';
import { FormikTextareaField } from '@/modules/common/components/Formik';
import { createSupabaseClient } from '@/models/supabase/services/SupabaseClient';
import { KooreroVoteService } from '@/models/koorero/services/KooreroVoteService';
import { Star } from 'lucide-react';
import { toast } from 'sonner';
import { notifyAboutError } from '@/modules/application/utils/notifyAboutError';

interface KooreroVotingFormProps {
  user: UserInterface;
}

const validationSchema = object().shape({
  interest_level: number().min(1).max(5).required('Please select your interest level'),
  feedback: string().max(500, 'Feedback must be 500 characters or less'),
});

const KooreroVotingForm = ({ user }: KooreroVotingFormProps) => {
  const [existingVote, setExistingVote] = useState<KooreroVoteInterface | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasVoted, setHasVoted] = useState(false);

  const kooreroVoteService = new KooreroVoteService(createSupabaseClient());

  useEffect(() => {
    const fetchExistingVote = async () => {
      try {
        const vote = await kooreroVoteService.getUserVote(user.id);
        setExistingVote(vote);
        setHasVoted(!!vote);
      } catch (error) {
        console.error('Error fetching existing vote:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchExistingVote();
  }, [user.id]);

  const handleSubmit = async (values: any, { setSubmitting }: any) => {
    try {
      const voteData = {
        user_id: user.id,
        interest_level: Number(values.interest_level),
        feedback: values.feedback || null,
      };

      if (existingVote) {
        await kooreroVoteService.updateVote(user.id, voteData);
        toast.success('Vote updated successfully!');
      } else {
        await kooreroVoteService.createVote(voteData);
        toast.success('Thank you for your vote!');
        setHasVoted(true);
      }

      // Refresh the existing vote
      const updatedVote = await kooreroVoteService.getUserVote(user.id);
      setExistingVote(updatedVote);
    } catch (error) {
      notifyAboutError(error);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Card className="shadow-sm rounded-2xl border border-gray-200" style={{ backgroundColor: '#f9fefd' }}>
        <CardContent className="p-8 text-center">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
      <Card className="h-fit shadow-sm rounded-2xl border border-gray-200" style={{ backgroundColor: '#f9fefd' }}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-[#0B4B39]">
            <Star className="w-5 h-5 text-yellow-500" />
            Tell us your interest level
          </CardTitle>
          <p className="text-sm text-gray-600">
            {hasVoted ? 'You can update your vote anytime' : 'Your feedback helps us build what you want'}
          </p>
        </CardHeader>
        <CardContent>
          <Formik
            initialValues={{
              interest_level: existingVote?.interest_level || '',
              feedback: existingVote?.feedback || '',
            }}
            validationSchema={validationSchema}
            onSubmit={handleSubmit}
            enableReinitialize
          >
            {({ isSubmitting, values, setFieldValue }) => (
              <Form className="space-y-6">
                <div className="space-y-4">
                  <Label className="text-base font-medium text-[#0B4B39]">How interested are you in this feature?</Label>
                  <RadioGroup
                    value={values.interest_level.toString()}
                    onValueChange={(value) => setFieldValue('interest_level', Number(value))}
                    className="space-y-3"
                  >
                    {Object.entries(INTEREST_LEVELS).map(([level, description]) => (
                      <div key={level} className="flex items-center space-x-3 p-3 rounded-2xl border border-gray-200 bg-[#0B4B39]/5 hover:bg-[#0B4B39]/10 transition-colors">
                        <RadioGroupItem value={level} id={`level-${level}`} className="border-[#0B4B39]/40 text-[#0B4B39]" />
                        <Label htmlFor={`level-${level}`} className="flex-1 cursor-pointer text-gray-800">
                          <span>{description}</span>
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>

                <div className="space-y-2">
                  <Label className="text-base font-medium text-[#0B4B39]">Additional feedback (optional)</Label>
                  <textarea
                    name="feedback"
                    placeholder="What specific features would you like to see? Any concerns or suggestions?"
                    rows={4}
                    className="w-full p-3 bg-white rounded-2xl border border-gray-200 text-gray-800 placeholder-gray-400 focus:ring-2 focus:ring-[#0B4B39]/30 focus:border-[#0B4B39]/40 focus:outline-none"
                    value={values.feedback || ''}
                    onChange={(e) => setFieldValue('feedback', e.target.value)}
                  />
                </div>

                <div className="flex gap-4">
                  <Button
                    type="submit"
                    disabled={isSubmitting || !values.interest_level}
                    className="flex-1 text-white font-semibold rounded-2xl"
                    style={{ backgroundColor: '#0B4B39' }}
                  >
                    {isSubmitting
                      ? (existingVote ? 'Updating...' : 'Submitting...')
                      : (existingVote ? 'Update Vote' : 'Submit Vote')
                    }
                  </Button>
                </div>

                {hasVoted && (
                  <div className="p-4 bg-[#0B4B39]/10 border border-[#0B4B39]/20 rounded-2xl">
                    <div className="flex items-center gap-2 text-[#0B4B39]">
                      <Star className="w-4 h-4 text-yellow-500" />
                      <span className="font-medium">Thank you for your feedback!</span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      Your vote helps us understand what features matter most to our community.
                    </p>
                  </div>
                )}
              </Form>
            )}
          </Formik>
        </CardContent>
      </Card>

      {/* Feature Preview */}
      <Card className="h-fit shadow-sm rounded-2xl border border-gray-200" style={{ backgroundColor: '#f9fefd' }}>
        <CardHeader>
          <CardTitle className="text-lg text-[#0B4B39]">What to expect from Koorero:</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-[#0B4B39]/5 border border-gray-200 rounded-2xl">
              <h4 className="font-medium text-[#0B4B39] mb-2">🎯 Goal Groups</h4>
              <p className="text-sm text-gray-600">Join groups with similar fitness goals and motivate each other</p>
            </div>
            <div className="p-4 bg-[#0B4B39]/5 border border-gray-200 rounded-2xl">
              <h4 className="font-medium text-[#0B4B39] mb-2">🏆 Achievement Sharing</h4>
              <p className="text-sm text-gray-600">Celebrate milestones and inspire others with your progress</p>
            </div>
            <div className="p-4 bg-[#0B4B39]/5 border border-gray-200 rounded-2xl">
              <h4 className="font-medium text-[#0B4B39] mb-2">💬 School Chat</h4>
              <p className="text-sm text-gray-600">Connect with students from your school and other schools</p>
            </div>
            <div className="p-4 bg-[#0B4B39]/5 border border-gray-200 rounded-2xl">
              <h4 className="font-medium text-[#0B4B39] mb-2">🔥 Challenge Updates</h4>
              <p className="text-sm text-gray-600">Get real-time updates on competitions and events</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default KooreroVotingForm; 