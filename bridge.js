const assert = require('assert');
const fs = require('fs');

let log = console.log.bind(console);

class Traveling {
  static loadAll() {
    const index = Traveling.loadIndex();
    return index.map(data =>
      new Traveling().load(data));
  }

  static loadIndex() {
    return require('./data/index.json');
  }

  load(data) {
    this.data = data;
    this.sessions = [];
    for (let url of data.urls) {
      log(`Reaidng ${url}`);
      let text = fs.readFileSync('data/' + url);
      this.parse(text.toString());
    }
    return this;
  }

  parse(text) {
    let lines = text.split('\n');
    let linenum = 0;
    while (linenum < lines.length) {
      let line = lines[linenum++];
      let match = line.match(/^Session (\d+)/);
      if (!match)
        match = line.match(/^(\d+)(st|nd) Session\tRank/);
      if (match) {
        let session = new Session(parseInt(match[1]));
        this.sessions.push(session);
        linenum = session.parse(lines, linenum);
        continue;
      }
    }
  }
}

class Session {
  constructor(session) {
    log(`Session ${session}`);
    this.session = session;
    this.boards = [];
  }

  parse(lines, linenum) {
    while (linenum < lines.length) {
      let line = lines[linenum++];
      let match = line.match(/^Board:? +\(?(\d+)\)?/);
      if (match) {
        let board = new Board(parseInt(match[1]));
        this.boards.push(board);
        linenum = board.parse(lines, linenum);
        continue;
      }

      // Bd	vs	Contract	by	md	Plus	Mihus	MP
      // 1	19	4♣	S	4		130	14.50
      match = line.match(/^(\d+)\t(\d+)?\t(\d[\w♣♦♥♠]{1,2})\t(\w)\t(-?\d+)\t(\d*)\t(\d*)\t([\d\.]+)/);
      if (match) {
        let board = new Board(parseInt(match[1]));
        this.boards.push(board);
        board.scores.push(new Score(null, match[3], match[4], parseInt(match[5]), [match[6], match[7]], parseFloat(match[8])));
        continue;
      }

      if (line.match(/^\d{4}\/\d{2}\/\d{2}/))
        return linenum - 1;
    }
    return linenum;
  }
}

class Board {
  constructor(board) {
    this.board = board;
    this.scores = [];
  }

  parse(lines, linenum) {
    while (linenum < lines.length) {
      let line = lines[linenum++];
      //  N-S E-W Contract N-S E-W    MP
      //   21   2 1NT S 2  120       17.5
      let match = line.match(/^ ([ \d]{3}) ([ \d]{3}) (\d\w{1,2}) +(\w) ?([-\d]+) ([ \d]{4}) ([ \d]{4}) ([ \d\.]{6})/);
      if (match) {
        this.scores.push(new Score(
          [parseInt(match[1]), parseInt(match[2])],
          match[3],
          match[4],
          parseInt(match[5]),
          [match[6], match[7]],
          parseFloat(match[8])));
        continue;
      }
      if (line[0] === '-')
        return linenum;
    }
    return linenum;
  }
}

class Score {
  constructor(users, contract, by, make, score, mp) {
    if (users)
      this.users = users;
    this.contract = contract;
    this.by = by;
    this.make = make;
    if (score) {
      if (Array.isArray(score)) {
        score = score.map(s => s.trim() ? parseInt(s) : null);
        if (score[0]) {
          if (!score[1])
            score = score[0];
        } else if (score[1]) {
          score = -score[1];
        } else {
          score = 0;
        }
      }
      this.score = score;
    }
    this.mp = mp;
  }
}

(function () {
  let travelings = Traveling.loadAll();
  fs.writeFileSync('data/combined.json',
                   JSON.stringify(travelings, null, 1));
})();
