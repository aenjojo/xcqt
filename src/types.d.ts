export interface Task {
  id: number;
  payload: string;
  executor: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
}