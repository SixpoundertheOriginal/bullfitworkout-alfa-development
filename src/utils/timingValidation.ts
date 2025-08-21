import { formatTime } from './formatTime';

export interface TimingIssue {
  severity: 'info' | 'warning' | 'error';
  code: string;
  message: string;
  suggestion?: string;
  values?: Record<string, any>;
}

export interface TimingReport {
  isValid: boolean;
  issues: TimingIssue[];
  breakdown: {
    globalElapsed: number;
    totalRestTime: number;
    estimatedExerciseTime: number;
    pausedTime: number;
    calculatedTotal: number;
    discrepancy: number;
  };
}

/**
 * Comprehensive timing validation system for workout sessions
 */
export class TimingValidator {
  
  /**
   * Validate timing consistency across all systems
   */
  static validateWorkoutTiming(params: {
    globalElapsed: number;
    totalRestTime: number;
    estimatedExerciseTime: number;
    pausedTime: number;
    startTime: string | null;
    isActive: boolean;
    setCount: number;
    completedSets: number;
  }): TimingReport {
    const {
      globalElapsed,
      totalRestTime,
      estimatedExerciseTime,
      pausedTime,
      startTime,
      isActive,
      setCount,
      completedSets
    } = params;

    const issues: TimingIssue[] = [];
    const calculatedTotal = totalRestTime + estimatedExerciseTime;
    const discrepancy = Math.abs(globalElapsed - calculatedTotal);

    // Check for major discrepancies
    if (discrepancy > 60) {
      issues.push({
        severity: 'error',
        code: 'MAJOR_DISCREPANCY',
        message: `Significant timing discrepancy detected: ${discrepancy}s`,
        suggestion: 'Check if rest times are being tracked correctly',
        values: { discrepancy, globalElapsed, calculatedTotal }
      });
    } else if (discrepancy > 30) {
      issues.push({
        severity: 'warning',
        code: 'MODERATE_DISCREPANCY',
        message: `Moderate timing discrepancy: ${discrepancy}s`,
        suggestion: 'This may indicate timing synchronization issues',
        values: { discrepancy }
      });
    }

    // Check if rest time seems excessive
    if (totalRestTime > globalElapsed * 0.85) {
      issues.push({
        severity: 'warning',
        code: 'EXCESSIVE_REST_TIME',
        message: 'Rest time appears unusually high relative to total workout time',
        suggestion: 'Verify rest timer tracking is accurate',
        values: { restPercentage: (totalRestTime / globalElapsed) * 100 }
      });
    }

    // Check for missing exercise timing data
    if (setCount > 0 && estimatedExerciseTime === 0 && globalElapsed > 120) {
      issues.push({
        severity: 'warning',
        code: 'MISSING_EXERCISE_TIMING',
        message: 'No exercise timing data available',
        suggestion: 'Set timing tracking may not be working properly',
        values: { setCount, globalElapsed }
      });
    }

    // Check for inconsistent set completion
    if (completedSets > 0 && totalRestTime === 0) {
      issues.push({
        severity: 'info',
        code: 'NO_REST_DATA',
        message: 'No rest time data recorded despite completed sets',
        suggestion: 'Rest analytics may not be initialized',
        values: { completedSets }
      });
    }

    // Check if global timer seems out of sync
    if (isActive && startTime) {
      const expectedElapsed = Math.floor((Date.now() - new Date(startTime).getTime() - pausedTime) / 1000);
      const timerDiscrepancy = Math.abs(globalElapsed - expectedElapsed);
      
      if (timerDiscrepancy > 10) {
        issues.push({
          severity: 'warning',
          code: 'TIMER_SYNC_ISSUE',
          message: `Global timer may be out of sync by ${timerDiscrepancy}s`,
          suggestion: 'Check if pause/resume is working correctly',
          values: { timerDiscrepancy, expected: expectedElapsed, actual: globalElapsed }
        });
      }
    }

    // Check for unusual exercise duration estimates
    if (setCount > 0 && estimatedExerciseTime > 0) {
      const avgTimePerSet = estimatedExerciseTime / setCount;
      if (avgTimePerSet > 120) {
        issues.push({
          severity: 'info',
          code: 'LONG_SET_DURATION',
          message: `Average set duration seems high: ${formatTime(avgTimePerSet)}`,
          suggestion: 'Verify set timing measurements are accurate',
          values: { avgTimePerSet, setCount }
        });
      } else if (avgTimePerSet < 15) {
        issues.push({
          severity: 'info',
          code: 'SHORT_SET_DURATION',
          message: `Average set duration seems low: ${formatTime(avgTimePerSet)}`,
          suggestion: 'Check if set start/end times are being recorded',
          values: { avgTimePerSet, setCount }
        });
      }
    }

    return {
      isValid: issues.filter(i => i.severity === 'error').length === 0,
      issues,
      breakdown: {
        globalElapsed,
        totalRestTime,
        estimatedExerciseTime,
        pausedTime,
        calculatedTotal,
        discrepancy
      }
    };
  }

  /**
   * Generate a human-readable timing report
   */
  static generateReport(report: TimingReport): string {
    const { breakdown, issues } = report;
    
    let output = '\n🕐 WORKOUT TIMING REPORT\n';
    output += '='.repeat(30) + '\n\n';
    
    output += '📊 TIMING BREAKDOWN:\n';
    output += `Global Timer: ${formatTime(breakdown.globalElapsed)}\n`;
    output += `Rest Time: ${formatTime(breakdown.totalRestTime)}\n`;
    output += `Exercise Time: ${formatTime(breakdown.estimatedExerciseTime)}\n`;
    output += `Paused Time: ${formatTime(breakdown.pausedTime)}\n`;
    output += `Calculated Total: ${formatTime(breakdown.calculatedTotal)}\n`;
    output += `Discrepancy: ${breakdown.discrepancy}s\n\n`;
    
    if (issues.length === 0) {
      output += '✅ No timing issues detected\n';
    } else {
      output += `⚠️  ISSUES FOUND (${issues.length}):\n`;
      issues.forEach((issue, index) => {
        const icon = issue.severity === 'error' ? '❌' : issue.severity === 'warning' ? '⚠️' : 'ℹ️';
        output += `${index + 1}. ${icon} ${issue.message}\n`;
        if (issue.suggestion) {
          output += `   💡 ${issue.suggestion}\n`;
        }
        if (issue.values) {
          output += `   📝 Data: ${JSON.stringify(issue.values)}\n`;
        }
        output += '\n';
      });
    }
    
    return output;
  }

  /**
   * Log timing validation results to console with appropriate severity
   */
  static logReport(report: TimingReport): void {
    const reportText = this.generateReport(report);
    
    const errorCount = report.issues.filter(i => i.severity === 'error').length;
    const warningCount = report.issues.filter(i => i.severity === 'warning').length;
    
    if (errorCount > 0) {
      console.error(reportText);
    } else if (warningCount > 0) {
      console.warn(reportText);
    } else {
      console.info(reportText);
    }
  }
}