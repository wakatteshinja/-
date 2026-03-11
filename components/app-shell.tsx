'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { fabric } from 'fabric';
import Papa from 'papaparse';
import JSZip from 'jszip';
import {
  Archive,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  Library,
  LogOut,
  PenLine,
  Plus,
  Upload,
  Users
} from 'lucide-react';
import { buckets, isSupabaseReady, supabase } from '@/lib/supabase';
import { DbClass, DbStudent, DbSubmission, DbTemplate, RectArea, ScoreBox, TemplateConfig } from '@/lib/types';

type TabKey = 'template' | 'grading' | 'students' | 'archive';

const storageUrl = (bucket: string, path: string) => supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;

export function AppShell() {
  const [userId, setUserId] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');

  const [tab, setTab] = useState<TabKey>('template');
  const [templates, setTemplates] = useState<DbTemplate[]>([]);
  const [classes, setClasses] = useState<DbClass[]>([]);
  const [students, setStudents] = useState<DbStudent[]>([]);
  const [submissions, setSubmissions] = useState<DbSubmission[]>([]);

  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setUserId(data.session?.user.id ?? null));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => setUserId(session?.user.id ?? null));
    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!userId || !isSupabaseReady) return;
    fetchAll();
  }, [userId]);

  const fetchAll = async () => {
    const [{ data: t }, { data: c }, { data: s }, { data: sub }] = await Promise.all([
      supabase.from('templates').select('*').order('created_at', { ascending: false }),
      supabase.from('classes').select('*').order('created_at', { ascending: false }),
      supabase.from('students').select('*').order('created_at', { ascending: true }),
      supabase.from('submissions').select('*').order('created_at', { ascending: false })
    ]);
    setTemplates((t as DbTemplate[]) ?? []);
    setClasses((c as DbClass[]) ?? []);
    setStudents((s as DbStudent[]) ?? []);
    setSubmissions((sub as DbSubmission[]) ?? []);
  };

  const login = async () => {
    if (authMode === 'login') await supabase.auth.signInWithPassword({ email, password });
    else await supabase.auth.signUp({ email, password });
  };

  if (!isSupabaseReady) {
    return <div className="p-8 text-red-700">.env.local に Supabase キーを設定してください。</div>;
  }

  if (!userId) {
    return (
      <div className="mx-auto mt-20 max-w-md rounded-xl bg-white p-8 shadow">
        <h1 className="mb-6 text-2xl font-bold">Digital Scorer Pro</h1>
        <div className="space-y-3">
          <input className="w-full rounded border p-2" placeholder="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <input className="w-full rounded border p-2" type="password" placeholder="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          <button className="w-full rounded bg-brand p-2 text-white" onClick={login}>
            {authMode === 'login' ? 'ログイン' : '新規登録'}
          </button>
          <button className="text-sm text-blue-600" onClick={() => setAuthMode(authMode === 'login' ? 'signup' : 'login')}>
            {authMode === 'login' ? '新規登録はこちら' : 'ログインへ戻る'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-6">
      <header className="mb-4 flex items-center justify-between rounded-xl bg-white p-4 shadow">
        <h1 className="text-xl font-bold">Digital Scorer Pro</h1>
        <button className="flex items-center gap-2 rounded border px-3 py-2" onClick={() => supabase.auth.signOut()}>
          <LogOut size={16} /> Sign out
        </button>
      </header>

      <div className="grid gap-4 md:grid-cols-[220px_1fr]">
        <aside className="rounded-xl bg-white p-3 shadow">
          {[
            ['template', 'テンプレート', Library],
            ['grading', '採点', PenLine],
            ['students', '生徒管理', Users],
            ['archive', 'アーカイブ', Archive]
          ].map(([key, label, Icon]) => (
            <button
              key={key}
              onClick={() => setTab(key as TabKey)}
              className={`mb-2 flex w-full items-center gap-2 rounded p-2 text-left ${tab === key ? 'bg-slate-900 text-white' : 'hover:bg-slate-100'}`}
            >
              <Icon size={16} /> {label}
            </button>
          ))}
        </aside>

        <main className="rounded-xl bg-white p-4 shadow">
          {tab === 'template' && <TemplateEditor onSaved={fetchAll} />}
          {tab === 'students' && (
            <StudentManager
              classes={classes}
              students={students}
              onSaved={fetchAll}
              setSelectedClassId={setSelectedClassId}
              selectedClassId={selectedClassId}
            />
          )}
          {tab === 'grading' && (
            <GradingPanel
              templates={templates}
              classes={classes}
              students={students}
              submissions={submissions}
              selectedTemplateId={selectedTemplateId}
              setSelectedTemplateId={setSelectedTemplateId}
              selectedClassId={selectedClassId}
              setSelectedClassId={setSelectedClassId}
              selectedStudentId={selectedStudentId}
              setSelectedStudentId={setSelectedStudentId}
              onSaved={fetchAll}
            />
          )}
          {tab === 'archive' && <ArchivePanel submissions={submissions} students={students} templates={templates} />}
        </main>
      </div>
    </div>
  );
}

function TemplateEditor({ onSaved }: { onSaved: () => void }) {
  const [name, setName] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState('');
  const [boxes, setBoxes] = useState<ScoreBox[]>([]);
  const [areaMode, setAreaMode] = useState(false);
  const [totalArea, setTotalArea] = useState<RectArea | undefined>();

  const onImageClick: React.MouseEventHandler<HTMLDivElement> = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    if (areaMode) {
      setTotalArea({ x, y, width: 90, height: 48 });
      setAreaMode(false);
      return;
    }
    const newBox: ScoreBox = { id: crypto.randomUUID(), label: `Q${boxes.length + 1}`, maxScore: 10, x, y, width: 80, height: 36 };
    setBoxes((prev) => [...prev, newBox]);
  };

  const saveTemplate = async () => {
    if (!file || !name) return;
    const path = `${crypto.randomUUID()}-${file.name}`;
    await supabase.storage.from(buckets.templates).upload(path, file, { upsert: false });
    const config: TemplateConfig = { scoreBoxes: boxes, totalArea };
    await supabase.from('templates').insert({ name, base_image_path: path, config });
    setName('');
    setFile(null);
    setImageUrl('');
    setBoxes([]);
    setTotalArea(undefined);
    onSaved();
  };

  return (
    <div className="space-y-3">
      <h2 className="text-lg font-semibold">テンプレート作成モード</h2>
      <div className="grid gap-2 md:grid-cols-3">
        <input className="rounded border p-2" placeholder="テンプレート名" value={name} onChange={(e) => setName(e.target.value)} />
        <label className="flex cursor-pointer items-center gap-2 rounded border p-2">
          <Upload size={16} /> 白紙答案をアップロード
          <input
            type="file"
            className="hidden"
            accept="image/*"
            onChange={(e) => {
              const f = e.target.files?.[0];
              setFile(f ?? null);
              setImageUrl(f ? URL.createObjectURL(f) : '');
            }}
          />
        </label>
        <button className="rounded border p-2" onClick={() => setAreaMode(true)}>
          合計表示エリア指定
        </button>
      </div>

      {imageUrl && (
        <div className="relative inline-block" onClick={onImageClick}>
          <img src={imageUrl} alt="template" className="max-h-[70vh] rounded border" />
          {boxes.map((b) => (
            <div key={b.id} className="absolute rounded border-2 border-blue-500 bg-blue-100/80 text-xs" style={{ left: b.x, top: b.y, width: b.width, height: b.height }}>
              {b.label}:{b.maxScore}
            </div>
          ))}
          {totalArea && <div className="absolute rounded border-2 border-emerald-600 bg-emerald-200/70" style={totalArea} />}
        </div>
      )}

      {boxes.length > 0 && (
        <div className="space-y-2 rounded border p-3">
          {boxes.map((b) => (
            <div key={b.id} className="grid grid-cols-3 gap-2 text-sm md:grid-cols-6">
              <input className="rounded border p-1" value={b.label} onChange={(e) => setBoxes((prev) => prev.map((x) => (x.id === b.id ? { ...x, label: e.target.value } : x)))} />
              <input className="rounded border p-1" type="number" value={b.maxScore} onChange={(e) => setBoxes((prev) => prev.map((x) => (x.id === b.id ? { ...x, maxScore: Number(e.target.value) } : x)))} />
              <button className="rounded border p-1" onClick={() => setBoxes((prev) => prev.filter((x) => x.id !== b.id))}>削除</button>
            </div>
          ))}
        </div>
      )}

      <button className="flex items-center gap-2 rounded bg-slate-900 px-4 py-2 text-white" onClick={saveTemplate}>
        <Plus size={16} /> テンプレート保存
      </button>
    </div>
  );
}

function StudentManager({
  classes,
  students,
  onSaved,
  selectedClassId,
  setSelectedClassId
}: {
  classes: DbClass[];
  students: DbStudent[];
  onSaved: () => void;
  selectedClassId: string;
  setSelectedClassId: (id: string) => void;
}) {
  const [className, setClassName] = useState('');
  const [listText, setListText] = useState('');

  const addClass = async () => {
    if (!className) return;
    await supabase.from('classes').insert({ name: className });
    setClassName('');
    onSaved();
  };

  const importStudents = async () => {
    if (!selectedClassId || !listText.trim()) return;
    const parsed = Papa.parse<string[]>(listText.trim(), { skipEmptyLines: true });
    const rows = parsed.data.map((row) => ({ class_id: selectedClassId, name: row[0], student_no: row[1] ?? null }));
    await supabase.from('students').insert(rows);
    setListText('');
    onSaved();
  };

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">生徒リスト管理</h2>
      <div className="grid gap-2 md:grid-cols-3">
        <input className="rounded border p-2" placeholder="クラス名" value={className} onChange={(e) => setClassName(e.target.value)} />
        <button className="rounded border p-2" onClick={addClass}>クラス作成</button>
        <select className="rounded border p-2" value={selectedClassId} onChange={(e) => setSelectedClassId(e.target.value)}>
          <option value="">クラス選択</option>
          {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>
      <textarea className="h-40 w-full rounded border p-2" placeholder="CSV or text: 山田太郎,1\n佐藤花子,2" value={listText} onChange={(e) => setListText(e.target.value)} />
      <button className="rounded bg-slate-900 px-4 py-2 text-white" onClick={importStudents}>名簿インポート</button>

      <div className="rounded border p-3">
        <h3 className="mb-2 font-medium">クラス生徒一覧</h3>
        {students.filter((s) => s.class_id === selectedClassId).map((s) => (
          <div key={s.id} className="border-b py-1 text-sm">{s.student_no ?? '-'} {s.name}</div>
        ))}
      </div>
    </div>
  );
}

function GradingPanel(props: {
  templates: DbTemplate[];
  classes: DbClass[];
  students: DbStudent[];
  submissions: DbSubmission[];
  selectedTemplateId: string;
  setSelectedTemplateId: (v: string) => void;
  selectedClassId: string;
  setSelectedClassId: (v: string) => void;
  selectedStudentId: string;
  setSelectedStudentId: (v: string) => void;
  onSaved: () => void;
}) {
  const {
    templates,
    classes,
    students,
    submissions,
    selectedTemplateId,
    setSelectedTemplateId,
    selectedClassId,
    setSelectedClassId,
    selectedStudentId,
    setSelectedStudentId,
    onSaved
  } = props;
  const [answerFile, setAnswerFile] = useState<File | null>(null);
  const [answerUrl, setAnswerUrl] = useState('');
  const [scores, setScores] = useState<Record<string, number>>({});
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fabricRef = useRef<fabric.Canvas | null>(null);

  const selectedTemplate = templates.find((t) => t.id === selectedTemplateId);
  const classStudents = students.filter((s) => s.class_id === selectedClassId);

  useEffect(() => {
    if (!canvasRef.current || !answerUrl) return;
    fabricRef.current?.dispose();
    const canvas = new fabric.Canvas(canvasRef.current, { isDrawingMode: true });
    canvas.freeDrawingBrush.color = '#dc2626';
    canvas.freeDrawingBrush.width = 2;
    fabricRef.current = canvas;
    return () => canvas.dispose();
  }, [answerUrl]);

  const total = useMemo(() => {
    const boxes = selectedTemplate?.config.scoreBoxes ?? [];
    return boxes.reduce((sum, b) => sum + Number(scores[b.id] ?? 0), 0);
  }, [scores, selectedTemplate]);

  const saveSubmission = async () => {
    if (!selectedTemplate || !selectedClassId || !selectedStudentId || !answerFile) return;
    const answerPath = `${crypto.randomUUID()}-${answerFile.name}`;
    await supabase.storage.from(buckets.answers).upload(answerPath, answerFile, { upsert: true });

    let annotatedPath: string | null = null;
    if (fabricRef.current) {
      const dataUrl = fabricRef.current.toDataURL({ format: 'png' });
      const blob = await (await fetch(dataUrl)).blob();
      annotatedPath = `${crypto.randomUUID()}.png`;
      await supabase.storage.from(buckets.annotated).upload(annotatedPath, blob, { upsert: true });
    }

    await supabase.from('submissions').upsert({
      template_id: selectedTemplateId,
      class_id: selectedClassId,
      student_id: selectedStudentId,
      answer_image_path: answerPath,
      annotated_image_path: annotatedPath,
      scores,
      total_score: total,
      status: 'graded'
    });
    onSaved();
  };

  const exportCsv = () => {
    const rows = submissions
      .filter((s) => s.class_id === selectedClassId)
      .map((s) => {
        const student = students.find((x) => x.id === s.student_id);
        return `${student?.name ?? ''},${s.total_score}`;
      });
    const csv = `name,total\n${rows.join('\n')}`;
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    a.download = 'scores.csv';
    a.click();
  };

  const exportZip = async () => {
    const zip = new JSZip();
    const classSubs = submissions.filter((s) => s.class_id === selectedClassId);
    for (const sub of classSubs) {
      const filePath = sub.annotated_image_path ?? sub.answer_image_path;
      const bucket = sub.annotated_image_path ? buckets.annotated : buckets.answers;
      const response = await fetch(storageUrl(bucket, filePath));
      zip.file(`${sub.student_id}.png`, await response.blob());
    }
    const content = await zip.generateAsync({ type: 'blob' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(content);
    a.download = 'graded-sheets.zip';
    a.click();
  };

  const classSubs = submissions.filter((s) => s.class_id === selectedClassId);
  const totals = classSubs.map((s) => s.total_score);
  const progress = selectedClassId ? Math.round((classSubs.length / Math.max(classStudents.length, 1)) * 100) : 0;

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">採点モード（連続採点対応）</h2>
      <div className="grid gap-2 md:grid-cols-3">
        <select className="rounded border p-2" value={selectedTemplateId} onChange={(e) => setSelectedTemplateId(e.target.value)}>
          <option value="">テンプレート選択</option>
          {templates.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
        <select className="rounded border p-2" value={selectedClassId} onChange={(e) => setSelectedClassId(e.target.value)}>
          <option value="">クラス選択</option>
          {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <div className="rounded border p-2 text-sm">
          <CheckCircle2 className="mr-1 inline" size={14} /> 採点済み: {classSubs.length}/{classStudents.length} ({progress}%)
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-[220px_1fr]">
        <div className="max-h-[70vh] overflow-y-auto rounded border p-2">
          {classStudents.map((s) => (
            <button key={s.id} onClick={() => setSelectedStudentId(s.id)} className={`mb-1 w-full rounded p-2 text-left text-sm ${selectedStudentId === s.id ? 'bg-slate-900 text-white' : 'bg-slate-100'}`}>
              {s.name}
            </button>
          ))}
        </div>

        <div className="space-y-3">
          <label className="flex cursor-pointer items-center gap-2 rounded border p-2">
            <Upload size={16} /> 生徒答案アップロード
            <input type="file" className="hidden" accept="image/*" onChange={(e) => {
              const f = e.target.files?.[0];
              setAnswerFile(f ?? null);
              setAnswerUrl(f ? URL.createObjectURL(f) : '');
            }} />
          </label>

          {answerUrl && selectedTemplate && (
            <div className="relative inline-block rounded border bg-white">
              <img src={answerUrl} alt="answer" className="max-h-[70vh]" />
              {(selectedTemplate.config.scoreBoxes ?? []).map((b) => (
                <input
                  key={b.id}
                  type="number"
                  className="absolute rounded border-2 border-blue-500 bg-white/90 p-1 text-sm"
                  style={{ left: b.x, top: b.y, width: b.width, height: b.height }}
                  value={scores[b.id] ?? ''}
                  onChange={(e) => setScores((prev) => ({ ...prev, [b.id]: Number(e.target.value) }))}
                />
              ))}
              {selectedTemplate.config.totalArea && (
                <div className="absolute flex items-center justify-center rounded border-2 border-emerald-600 bg-emerald-100/80 text-lg font-bold" style={selectedTemplate.config.totalArea}>
                  {total}
                </div>
              )}
              <canvas ref={canvasRef} width={1000} height={1400} className="pointer-events-auto absolute left-0 top-0 opacity-90" />
            </div>
          )}

          <div className="grid gap-2 md:grid-cols-4">
            <div className="rounded border p-2 text-sm">平均: {totals.length ? (totals.reduce((a, b) => a + b, 0) / totals.length).toFixed(1) : '-'}</div>
            <div className="rounded border p-2 text-sm">最高: {totals.length ? Math.max(...totals) : '-'}</div>
            <div className="rounded border p-2 text-sm">最低: {totals.length ? Math.min(...totals) : '-'}</div>
            <div className="rounded border p-2 text-sm">現在合計: {total}</div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button className="rounded bg-brand px-4 py-2 text-white" onClick={saveSubmission}>保存</button>
            <button className="flex items-center gap-2 rounded border px-3 py-2" onClick={exportCsv}><FileSpreadsheet size={16} /> CSV</button>
            <button className="flex items-center gap-2 rounded border px-3 py-2" onClick={exportZip}><Download size={16} /> ZIP</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ArchivePanel({ submissions, students, templates }: { submissions: DbSubmission[]; students: DbStudent[]; templates: DbTemplate[] }) {
  return (
    <div>
      <h2 className="mb-3 text-lg font-semibold">採点済みアーカイブ</h2>
      <div className="overflow-x-auto rounded border">
        <table className="w-full text-sm">
          <thead className="bg-slate-100">
            <tr>
              <th className="p-2 text-left">生徒</th>
              <th className="p-2 text-left">テンプレート</th>
              <th className="p-2 text-left">合計点</th>
              <th className="p-2 text-left">作成日</th>
            </tr>
          </thead>
          <tbody>
            {submissions.map((s) => (
              <tr key={s.id} className="border-t">
                <td className="p-2">{students.find((x) => x.id === s.student_id)?.name ?? '-'}</td>
                <td className="p-2">{templates.find((x) => x.id === s.template_id)?.name ?? '-'}</td>
                <td className="p-2">{s.total_score}</td>
                <td className="p-2">{new Date(s.created_at).toLocaleString('ja-JP')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
