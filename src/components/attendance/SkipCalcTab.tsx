'use client';

import { motion } from 'framer-motion';
import { AlertTriangle, ShieldCheck } from 'lucide-react';
import type { AttendanceSummary } from './types';
import { RISK } from './types';

interface SkipCalcTabProps {
	insights: AttendanceSummary[];
}

export function SkipCalcTab({ insights }: SkipCalcTabProps) {
	if (insights.length === 0 || insights.every((s) => s.total === 0)) {
		return (
			<div className="py-16 text-center">
				<ShieldCheck className="w-10 h-10 text-text-muted/20 mx-auto mb-4" />
				<p className="font-mono text-sm text-text-muted">No attendance data yet</p>
				<p className="font-mono text-tiny text-text-muted mt-1">
					Mark some classes or use Bulk Set to import your attendance
				</p>
			</div>
		);
	}

	return (
		<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
			{insights
				.sort((a, b) => a.percentage - b.percentage)
				.map((s) => {
					const risk = RISK[s.risk_level];
					return (
						<div key={s.course_id} className="border border-border-hard p-5">
							<div className="flex items-center gap-2 mb-3">
								<div
									className="w-3 h-3 rounded-full shrink-0"
									style={{ backgroundColor: s.color }}
								/>
								<span className="font-mono text-sm font-bold text-text-primary flex-1">
									{s.course_name}
									{s.course_code && <span className="text-text-muted ml-1">({s.course_code})</span>}
								</span>
								<span
									className={`px-2 py-0.5 font-mono text-[10px] font-black uppercase tracking-widest ${risk.bg} ${risk.color}`}
								>
									{risk.label}
								</span>
							</div>

							{/* Semester Stats */}
							<p className="font-mono text-[10px] text-text-muted uppercase tracking-widest font-bold mb-2">
								Semester
							</p>
							<div className="grid grid-cols-3 gap-4 mb-2">
								<div>
									<p className={`font-mono text-2xl font-black tabular-nums ${risk.color}`}>
										{s.percentage}%
									</p>
									<p className="font-mono text-tiny text-text-muted uppercase">Current</p>
								</div>
								<div>
									<p className="font-mono text-2xl font-black text-text-primary tabular-nums">
										{s.attended}/{s.total}
									</p>
									<p className="font-mono text-tiny text-text-muted uppercase">Attended</p>
								</div>
								<div>
									<p className="font-mono text-2xl font-black text-text-secondary tabular-nums">
										{s.projected_end}%
									</p>
									<p className="font-mono text-tiny text-text-muted uppercase">Projected</p>
								</div>
							</div>

							{/* Monthly Stats */}
							{s.monthly_total > 0 && (
								<>
									<p className="font-mono text-[10px] text-text-muted uppercase tracking-widest font-bold mb-2 mt-3">
										This Month
									</p>
									<div className="grid grid-cols-3 gap-4 mb-2">
										<div>
											<p className="font-mono text-lg font-black text-text-primary tabular-nums">
												{s.monthly_percentage}%
											</p>
											<p className="font-mono text-tiny text-text-muted uppercase">Pct</p>
										</div>
										<div>
											<p className="font-mono text-lg font-black text-text-primary tabular-nums">
												{s.monthly_attended}/{s.monthly_total}
											</p>
											<p className="font-mono text-tiny text-text-muted uppercase">Attended</p>
										</div>
										<div>
											<p className="font-mono text-lg font-black text-text-primary tabular-nums">
												{s.monthly_skippable}
											</p>
											<p className="font-mono text-tiny text-text-muted uppercase">Can Skip</p>
										</div>
									</div>
								</>
							)}

							{/* Progress bar */}
							<div className="h-2 bg-void border border-border-hard/30 mb-3 overflow-hidden">
								<div
									className="h-full transition-all duration-500"
									style={{
										width: `${Math.min(100, s.percentage)}%`,
										backgroundColor:
											s.risk_level === 'danger'
												? '#ff0040'
												: s.risk_level === 'warning'
													? '#ff6b00'
													: '#39ff14',
									}}
								/>
							</div>

							{/* Verdict */}
							{s.risk_level === 'danger' ? (
								<div className="flex items-start gap-2">
									<AlertTriangle className="w-3.5 h-3.5 text-neon-red shrink-0 mt-0.5" />
									<p className="font-mono text-sm text-neon-red">
										Attend <span className="font-black">{s.classes_needed}</span> consecutive
										classes to recover to 76%
									</p>
								</div>
							) : (
								<div className="flex items-start gap-2">
									<ShieldCheck className="w-3.5 h-3.5 text-neon-green shrink-0 mt-0.5" />
									<p className="font-mono text-sm text-text-secondary">
										You can safely skip{' '}
										<span className="font-black text-neon-green">{s.skippable}</span> more{' '}
										{s.skippable === 1 ? 'class' : 'classes'} this semester.
									</p>
								</div>
							)}

							<div className="mt-2 flex items-center gap-1.5">
								<span
									className={`w-2 h-2 rounded-full ${s.safe_to_skip_today ? 'bg-neon-green' : 'bg-neon-red'}`}
								/>
								<span className="font-mono text-tiny text-text-muted">
									{s.safe_to_skip_today ? 'Safe to skip today' : 'DO NOT skip today'}
								</span>
							</div>
						</div>
					);
				})}
		</motion.div>
	);
}
