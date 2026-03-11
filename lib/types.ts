export type ScoreBox = {
  id: string;
  label: string;
  maxScore: number;
  x: number;
  y: number;
  width: number;
  height: number;
};

export type RectArea = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type TemplateConfig = {
  scoreBoxes: ScoreBox[];
  totalArea?: RectArea;
};

export type DbTemplate = {
  id: string;
  name: string;
  base_image_path: string;
  config: TemplateConfig;
};

export type DbClass = { id: string; name: string };
export type DbStudent = { id: string; class_id: string; name: string; student_no: string | null };

export type DbSubmission = {
  id: string;
  template_id: string;
  class_id: string;
  student_id: string;
  answer_image_path: string;
  annotated_image_path: string | null;
  scores: Record<string, number>;
  total_score: number;
  status: 'draft' | 'graded';
  created_at: string;
};
