import path from 'path';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const voiceDir = path.join(__dirname, 'public', 'Voice');

function getFile(filename) {
  return path.join(voiceDir, filename);
}

function Say(number, loc, list) {
  const { hundreds, tens, units, lastTwo } = decomposeNumber(number);

  if (hundreds !== 0)
    list.push(getFile(`${hundreds}00_${loc}.wav`));
  if (lastTwo > 9 && lastTwo < 20) {
    list.push(getFile(`${lastTwo}_${loc}.wav`));
  } else {
    list.push(getFile(`${tens}0_${loc}.wav`));
    if (units !== 0)
      list.push(getFile(`${units}_${loc}.wav`));
  }
}

function SayPharsy(number, loc, list) {
  list.push(getFile(`${number}_pharsy_${loc}.wav`));
}

function SayTurkic(number, loc, list) {
  list.push(getFile(`${number}_turkic_${loc}.wav`));
}

function containsLatinLetters(str) {
  return /[a-zA-Z]/.test(str);
}

function decomposeNumber(number) {
  if (number < 0 || number > 999) {
    throw new Error("Number must be between 0 and 999");
  }

  const s = number.toString().padStart(3, '0');
  const hundreds = parseInt(s[0], 10);
  const tens = parseInt(s[1], 10);
  const units = parseInt(s[2], 10);
  const lastTwo = parseInt(s.slice(1), 10);

  return { hundreds, tens, units, lastTwo };
}


export function buildVoicePlayList({ usingVoice, Numb, Win, Localization, Kassa }) {
  const VoicePlayList = [];
  let number;

  if (usingVoice) {
    let NumbSay = Numb;
    VoicePlayList.push(getFile(`01_NUM_${Localization}.wav`));
    
    const winNum = parseInt(Win);

    console.log('Номер окна:', winNum);

    if (Localization === 'TJ') {
      SayPharsy(number, Localization, VoicePlayList);
    } else {
      if (!containsLatinLetters(NumbSay)) {
        number = parseInt(NumbSay);
        Say(number, Localization, VoicePlayList)
      }
    }

    if (Kassa && Localization === 'RU') {
      VoicePlayList.push(getFile(`02_NUM_KASSA_${Localization}.wav`));
    } else {
      VoicePlayList.push(getFile(`02_NUM_${Localization}.wav`));
    }

    if (['KZ', 'KG'].includes(Localization)) {
      SayTurkic(winNum, Localization, VoicePlayList);
    } else if (Localization === 'TJ') {
      SayPharsy(winNum, Localization, VoicePlayList);
    } else {
      Say(winNum, Localization, VoicePlayList);
    }

    if (['KZ', 'KG', 'TJ'].includes(Localization)) {
      const postfix = Kassa ? 'KASSA_' : '';
      VoicePlayList.push(getFile(`03_NUM_${postfix}${Localization}.wav`));
    }

    VoicePlayList.push('stop');
  }

  return VoicePlayList;
}

// Воспроизведение через spawn
export function playPlaylist(list) {
  function next(index) {
    if (index >= list.length) return;
    const item = list[index];
    if (item === 'stop') {
      console.log('⏹️  Остановлено');
      return;
    }
    console.log('🔊 Воспроизведение:', item);

    const ffplayProcess = spawn('ffplay', ['-nodisp', '-autoexit', item]);

    ffplayProcess.on('close', (code) => {
      if (code !== 0) {
        console.error('Ошибка при воспроизведении:', code);
      }
      next(index + 1);
    });

    ffplayProcess.on('error', (err) => {
      console.error('Ошибка при воспроизведении:', err);
      next(index + 1);
    });
  }

  next(0);
}

// 🧪 Пример использования
const playlist = buildVoicePlayList({
  usingVoice: true,
  Numb: '123',
  Win: '45',
  Localization: 'RU',
  Kassa: false
});

playPlaylist(playlist);
