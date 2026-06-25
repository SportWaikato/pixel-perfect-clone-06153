import { SupabaseClient } from '@supabase/supabase-js';
import { KooreroVoteInterface } from '../interfaces/KooreroVoteInterface';

const TABLE_NAME = 'korero_votes';

export class KooreroVoteService {
  private supabaseClient: SupabaseClient;

  constructor(supabaseClient: SupabaseClient) {
    this.supabaseClient = supabaseClient;
  }

  async getUserVote(userId: string): Promise<KooreroVoteInterface | null> {
    const { data, error } = await this.supabaseClient
      .from(TABLE_NAME)
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error || !data) return null;
    return data;
  }

  async createVote(voteData: Partial<KooreroVoteInterface>): Promise<KooreroVoteInterface> {
    const { data, error } = await this.supabaseClient
      .from(TABLE_NAME)
      .insert(voteData)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  async updateVote(userId: string, voteData: Partial<KooreroVoteInterface>): Promise<KooreroVoteInterface> {
    const { data, error } = await this.supabaseClient
      .from(TABLE_NAME)
      .update({
        ...voteData,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  async getVoteStats(): Promise<{
    total_votes: number;
    average_interest: number;
    interest_distribution: Record<number, number>;
  }> {
    const { data, error } = await this.supabaseClient
      .from(TABLE_NAME)
      .select('interest_level');

    if (error || !data) {
      return { total_votes: 0, average_interest: 0, interest_distribution: {} };
    }

    const totalVotes = data.length;
    const sum = data.reduce((acc, vote) => acc + vote.interest_level, 0);
    const average = totalVotes > 0 ? sum / totalVotes : 0;

    const distribution: Record<number, number> = {};
    data.forEach(vote => {
      distribution[vote.interest_level] = (distribution[vote.interest_level] || 0) + 1;
    });

    return {
      total_votes: totalVotes,
      average_interest: Number(average.toFixed(2)),
      interest_distribution: distribution
    };
  }
} 