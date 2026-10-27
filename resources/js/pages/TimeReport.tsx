import { useCallback, useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Alert, Card, CardContent, CardDescription, CardHeader, CardTitle, Input } from '@/components/ui';
import { api, type TimeReport as TimeReportData } from '@/services/api';
import { getLocalDateString } from '@/utils/helpers';
import { ClockIcon, DocumentTextIcon, UsersIcon } from '@heroicons/react/24/outline';

const today = getLocalDateString();
const monthStart = `${today.slice(0, 8)}01`;

function formatHours(minutes: number): string {
  return `${(minutes / 60).toLocaleString('id-ID', { maximumFractionDigits: 2 })} jam`;
}

export function TimeReport() {
  const [report, setReport] = useState<TimeReportData | null>(null);
  const [from, setFrom] = useState(monthStart);
  const [to, setTo] = useState(today);
  const [userId, setUserId] = useState('');
  const [projectId, setProjectId] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const loadReport = useCallback(async () => {
    setIsLoading(true);
    const response = await api.getTimeReport({
      from,
      to,
      user_id: userId || undefined,
      project_id: projectId || undefined,
    });

    if (response.success && response.data) {
      setReport(response.data);
      setError('');
    } else {
      setError(response.message || 'Gagal memuat laporan waktu kerja.');
    }

    setIsLoading(false);
  }, [from, to, userId, projectId]);

  useEffect(() => {
    loadReport();
  }, [loadReport]);

  return (
    <DashboardLayout>
      <div className="mb-8 animate-fade-in">
        <h1 className="text-3xl font-bold text-neutral-900">Time &amp; Productivity Tracking</h1>
        <p className="mt-2 text-neutral-600">Laporan jam kerja yang dicatat per anggota tim dan proyek.</p>
      </div>

      {error && <Alert variant="error" className="mb-6">{error}</Alert>}

      <Card variant="elevated" padding="lg" className="mb-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Input label="Dari tanggal" type="date" value={from} max={to} onChange={(event) => setFrom(event.target.value)} />
          <Input label="Sampai tanggal" type="date" value={to} min={from} max={today} onChange={(event) => setTo(event.target.value)} />
          <div>
            <label htmlFor="time-report-member" className="label">Anggota tim</label>
            <select id="time-report-member" value={userId} onChange={(event) => setUserId(event.target.value)} className="input-field">
              <option value="">Semua anggota</option>
              {report?.users.map((user) => <option key={user.id} value={user.id}>{user.name}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="time-report-project" className="label">Proyek</label>
            <select id="time-report-project" value={projectId} onChange={(event) => setProjectId(event.target.value)} className="input-field">
              <option value="">Semua proyek</option>
              {report?.projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}
            </select>
          </div>
        </div>
      </Card>

      {isLoading ? (
        <div className="flex items-center justify-center py-24">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary-500 border-t-transparent" aria-label="Memuat laporan" />
        </div>
      ) : report && (
        <>
          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Card variant="elevated" padding="lg">
              <div className="flex items-center justify-between">
                <div><p className="text-sm font-medium text-neutral-500">Total jam kerja</p><p className="mt-1 text-3xl font-bold text-neutral-900">{formatHours(report.summary.total_minutes)}</p></div>
                <span className="rounded-xl bg-pastel-blue-100 p-3 text-pastel-blue-600"><ClockIcon className="h-6 w-6" aria-hidden="true" /></span>
              </div>
            </Card>
            <Card variant="elevated" padding="lg">
              <div className="flex items-center justify-between">
                <div><p className="text-sm font-medium text-neutral-500">Jumlah catatan</p><p className="mt-1 text-3xl font-bold text-neutral-900">{report.summary.log_count}</p></div>
                <span className="rounded-xl bg-pastel-purple-100 p-3 text-pastel-purple-600"><DocumentTextIcon className="h-6 w-6" aria-hidden="true" /></span>
              </div>
            </Card>
            <Card variant="elevated" padding="lg">
              <div className="flex items-center justify-between">
                <div><p className="text-sm font-medium text-neutral-500">Anggota dengan catatan</p><p className="mt-1 text-3xl font-bold text-neutral-900">{report.member_totals.length}</p></div>
                <span className="rounded-xl bg-pastel-green-100 p-3 text-pastel-green-600"><UsersIcon className="h-6 w-6" aria-hidden="true" /></span>
              </div>
            </Card>
          </div>

          <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card variant="elevated" padding="lg">
              <CardHeader><CardTitle>Total per Anggota</CardTitle><CardDescription>Akumulasi durasi pada rentang tanggal terpilih</CardDescription></CardHeader>
              <CardContent>
                {report.member_totals.length === 0 ? <p className="py-6 text-center text-sm text-neutral-500">Belum ada catatan waktu.</p> : (
                  <div className="space-y-4">
                    {report.member_totals.map((member) => (
                      <div key={member.id}>
                        <div className="mb-1 flex items-center justify-between gap-3 text-sm"><span className="font-medium text-neutral-800">{member.name}</span><span className="font-semibold text-neutral-900">{formatHours(member.total_minutes)}</span></div>
                        <div className="h-2 overflow-hidden rounded-full bg-neutral-100"><div className="h-full rounded-full bg-primary-500" style={{ width: `${report.summary.total_minutes ? Math.max(3, member.total_minutes / report.summary.total_minutes * 100) : 0}%` }} /></div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
            <Card variant="elevated" padding="lg">
              <CardHeader><CardTitle>Total per Proyek</CardTitle><CardDescription>Akumulasi durasi pada rentang tanggal terpilih</CardDescription></CardHeader>
              <CardContent>
                {report.project_totals.length === 0 ? <p className="py-6 text-center text-sm text-neutral-500">Belum ada catatan waktu.</p> : (
                  <div className="space-y-4">
                    {report.project_totals.map((project) => (
                      <div key={project.id}>
                        <div className="mb-1 flex items-center justify-between gap-3 text-sm"><span className="font-medium text-neutral-800">{project.name}</span><span className="font-semibold text-neutral-900">{formatHours(project.total_minutes)}</span></div>
                        <div className="h-2 overflow-hidden rounded-full bg-neutral-100"><div className="h-full rounded-full bg-pastel-green-500" style={{ width: `${report.summary.total_minutes ? Math.max(3, project.total_minutes / report.summary.total_minutes * 100) : 0}%` }} /></div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <Card variant="elevated" padding="lg">
            <CardHeader><CardTitle>Time Tracking Log</CardTitle><CardDescription>Menampilkan maksimal 100 catatan terbaru; ringkasan tetap menghitung seluruh data dalam filter.</CardDescription></CardHeader>
            <CardContent>
              {report.logs.length === 0 ? <p className="py-8 text-center text-sm text-neutral-500">Belum ada catatan waktu pada periode ini.</p> : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[700px] text-left text-sm">
                    <thead><tr className="border-b border-neutral-200 text-xs uppercase tracking-wide text-neutral-500"><th className="py-3 pr-4">Tanggal</th><th className="py-3 pr-4">Anggota</th><th className="py-3 pr-4">Proyek / Tugas</th><th className="py-3 pr-4">Durasi</th><th className="py-3">Catatan</th></tr></thead>
                    <tbody className="divide-y divide-neutral-100">
                      {report.logs.map((log) => (
                        <tr key={log.id} className="align-top"><td className="py-3 pr-4 text-neutral-600">{log.logged_on}</td><td className="py-3 pr-4 font-medium text-neutral-800">{log.user.name}</td><td className="py-3 pr-4"><p className="font-medium text-neutral-800">{log.project.name}</p><p className="text-xs text-neutral-500">{log.task.title}</p></td><td className="whitespace-nowrap py-3 pr-4 font-semibold text-neutral-900">{formatHours(log.duration_minutes)}</td><td className="max-w-xs py-3 text-neutral-600">{log.note || '—'}</td></tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </DashboardLayout>
  );
}
