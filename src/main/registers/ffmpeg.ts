import { spawn } from 'child_process';
import { ipcMain } from 'electron';
import { FFMPEG_PATH } from '../constants/path';

function getParsedStringNumber(value: string): number | null {
  if (!value) return null;

  if (value.indexOf('-inf') !== -1) {
    return null;
  } else if (value.indexOf('inf') !== -1) {
    return null;
  } else {
    return Number(value);
  }
}

function parseLoudnessLog(log: string) {
  const regex = new RegExp('ebur128.+t:.+', 'g');
  const loudness: any = {
    summary: {},
    details: [],
    status: 'NONE',
  };

  const isLoudnessLog = regex.test(log);
  if (isLoudnessLog) {
    const time = Number(getParsedStringNumber(log.match(/t:(( *-?\d+\.*\d*)|( *-?inf))+/)?.[1]).toFixed(1));
    const targetLoudness = getParsedStringNumber(log.match(/TARGET:(( *-?\d+\.*\d*)|( *-?inf))+/)?.[1]);
    const momentaryLoudness = getParsedStringNumber(log.match(/M:(( *-?\d+\.*\d*)|( *-?inf))+/)?.[1]);
    const shortTermLoudness = getParsedStringNumber(log.match(/S:(( *-?\d+\.*\d*)|( *-?inf))+/)?.[1]);
    const integratedLoudness = getParsedStringNumber(log.match(/I:(( *-?\d+\.*\d*)|( *-?inf))+/)?.[1]);
    const loudnessRange = getParsedStringNumber(log.match(/LRA:(( *-?\d+\.*\d*)|( *-?inf))+/)?.[1]);
    const frameTruePeakString = log.match(/FTPK:(( *-?\d+\.*\d*)|( *-?inf))+/)?.[0];
    const truePeakString = log.match(/ TPK:(( *-?\d+\.*\d*)|( *-?inf))+/)?.[0];
    const frameTruePeaks = (frameTruePeakString || '')
      .replace('FTPK:', '')
      .replace(/ +/g, ' ')
      .trim()
      .split(' ')
      .map(getParsedStringNumber)
      .filter((v) => v !== undefined && v !== null);
    const truePeaks = (truePeakString || '')
      .replace('TPK:', '')
      .replace(/ +/g, ' ')
      .trim()
      .split(' ')
      .map(getParsedStringNumber)
      .filter((v) => v !== undefined && v !== null);

    const detail = {
      time,
      momentaryLoudness,
      shortTermLoudness,
      integratedLoudness,
      loudnessRange,
      frameTruePeaks,
      truePeaks,
    };

    loudness.status = 'DETAILS';
    loudness.details.push(detail);
  } else {
    const i = getParsedStringNumber(log.match(/I:(( *-?\d+\.*\d*)|( *-?inf))+ LUFS/)?.[1]);
    if (i !== null && i !== undefined) {
      loudness.summary.i = i;
    }

    const lra = getParsedStringNumber(log.match(/LRA:(( *-?\d+\.*\d*)|( *-?inf))+ LU/)?.[1]);
    if (lra !== null && lra !== undefined) {
      loudness.summary.lra = lra;
    }

    const threshold = getParsedStringNumber(log.match(/Threshold:(( *-?\d+\.*\d*)|( *-?inf))+ LUFS/)?.[1]);
    if (threshold !== null && threshold !== undefined) {
      loudness.summary.threshold = threshold;
    }

    const lraLow = getParsedStringNumber(log.match(/LRA low:(( *-?\d+\.*\d*)|( *-?inf))+ LUFS/)?.[1]);
    if (lraLow !== null && lraLow !== undefined) {
      loudness.summary.lraLow = lraLow;
    }

    const lraHigh = getParsedStringNumber(log.match(/LRA high:(( *-?\d+\.*\d*)|( *-?inf))+ LUFS/)?.[1]);
    if (lraHigh !== null && lraHigh !== undefined) {
      loudness.summary.lraHigh = lraHigh;
    }

    const peak = getParsedStringNumber(log.match(/Peak:(( *-?\d+\.*\d*)|( *-?inf))+ dBFS/)?.[1]);
    if (peak !== null && peak !== undefined) {
      loudness.summary.peak = peak;
    }

    if (log.indexOf('Integrated loudness:') >= 0) {
      loudness.status = 'INTEGRATED_LOUDNESS_SUMMARY';
    }

    if (log.indexOf('Loudness range:') >= 0) {
      loudness.status = 'LRA_SUMMARY';
    }

    if (log.indexOf('True peak:') >= 0) {
      loudness.status = 'PEAK_SUMMARY';
    }
  }

  return loudness;
}

export async function extractLoudness(src: string): Promise<void> {
  const summary: any = {
    integratedLoudness: {
      i: null,
      threshold: null,
    },
    loudnessRange: {
      lra: null,
      threshold: null,
      lraLow: null,
      lraHigh: null,
    },
    truePeak: {
      peak: null,
    },
  };

  let status = 'NONE';
  let stdout = '';

  const parsing = (log: string) => {
    const loudness = parseLoudnessLog(log);

    if (Object.keys(loudness.summary).length) {
      const i = loudness.summary.i;
      if (i !== null && i !== undefined) {
        summary.integratedLoudness.i = i;
      }

      const threshold = loudness.summary.threshold;
      if (threshold !== null && threshold !== undefined) {
        if (status === 'INTEGRATED_LOUDNESS_SUMMARY') {
          summary.integratedLoudness.threshold = threshold;
        } else if (status === 'LRA_SUMMARY') {
          summary.loudnessRange.threshold = threshold;
        }
      }

      const lra = loudness.summary.lra;
      if (lra !== null && lra !== undefined) {
        summary.loudnessRange.lra = lra;
      }

      const lraLow = loudness.summary.lraLow;
      if (lraLow !== null && lraLow !== undefined) {
        summary.loudnessRange.lraLow = lraLow;
      }

      const lraHigh = loudness.summary.lraHigh;
      if (lraHigh !== null && lraHigh !== undefined) {
        summary.loudnessRange.lraHigh = lraHigh;
      }

      const peak = loudness.summary.peak;
      if (peak !== null && peak !== undefined) {
        summary.truePeak.peak = peak;
      }
    }
  };

  try {
    await new Promise<void>((resolve, reject) => {
      const process = spawn(FFMPEG_PATH, [
        '-y',
        '-hide_banner',
        '-nostats',
        '-nostdin',
        '-err_detect',
        'ignore_err',
        '-loglevel',
        'info',
        '-i',
        src,
        '-filter_complex',
        'aformat=sample_fmts=s16:sample_rates=48000,ebur128=peak=true',
        '-f',
        'null',
        '-',
      ]);

      process.stdout.on('data', (data) => {
        if (data) {
          const log = data.toString();
          stdout += log;
          console.log(log);
        }
      });

      process.stderr.on('data', (data) => {
        if (data) {
          const log = data.toString();
          stdout += log;
          console.log(log);
        }
      });

      process.once('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`FFPROBE exited with code ${code}`));
        }
      });

      process.once('error', (e) => {
        reject(e);
      });
    });

    const logs = stdout.split('\n');

    for (const log of logs) {
      parsing(log);
    }

    return summary;
  } catch (e) {
    throw e;
  }
}

ipcMain.handle('ffmpeg-extract-loudness-summary', async (event, { path }) => {
  try {
    const summary = await extractLoudness(path);
    return {
      status: 'DONE',
      summary,
    };
  } catch (e) {
    return {
      status: 'ERROR',
    };
  }
});
