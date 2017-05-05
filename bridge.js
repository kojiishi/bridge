const assert = require('assert');
const fs = require('fs');

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
      let text = fs.readFileSync('data/' + url);
      this.parse(text.toString());
    }
    return this;
  }

  parse(text) {
    let lines = text.split('\n');
    let linenum = 0;
    let session, board, scores, boards;
    while (linenum < lines.length) {
      let line = lines[linenum++];
      let match = line.match(/^Session (\d+)/);
      if (match) {
        assert(!session);
        session = { session: parseInt(match[1]) };
        if (linenum >= 2) {
          let name = lines[linenum - 2];
          name = name.replace(/\s*<[^>]*>\s*/g, '');
          console.log(name);
          session.name = name;
        }
        session.boards = boards = [];
        continue;
      }
      if (!session)
        continue;

      match = line.match(/^Board:? +\((\d+)\)/);
      if (match) {
        if (board)
          boards.push(board);
        board = { board: parseInt(match[1]) };
        board.scores = scores = [];
        continue;
      }
      if (!board)
        continue;

      //  N-S E-W Contract N-S E-W    MP
      //   21   2 1NT S 2  120       17.5
      match = line.match(/^ ([ \d]{3}) ([ \d]{3}) (\d\w{1,2}) +(\w) ?([-\d]+) ([ \d]{4}) ([ \d]{4}) ([ \d\.]{6})/);
      if (match) {
        scores.push({
          ns: parseInt(match[1]),
          ew: parseInt(match[2]),
          contract: match[3],
          by: match[4],
          make: parseInt(match[5]),
          nsscore: match[6].trim() ? parseInt(match[6]) : 0,
          ewscore: match[7].trim() ? parseInt(match[7]) : 0,
          mp: parseFloat(match[8])
        });
        continue;
      }

      // 20170318-1.html
      //  N-S E-W Contract N-S E-W     IMP
      //    9   5 3NT W 4      630       1
      match = line.match(/^ ([ \d]{3}) ([ \d]{3}) (\d\w{1,2}) +(\w) ?([-\d]+) ([ \d]{4}) ([ \d]{4}) ([ \d\.]{6})/);
      if (match) {
        scores.push({
          ns: parseInt(match[1]),
          ew: parseInt(match[2]),
          contract: match[3],
          by: match[4],
          make: parseInt(match[5]),
          nsscore: match[6].trim() ? parseInt(match[6]) : 0,
          ewscore: match[7].trim() ? parseInt(match[7]) : 0,
          mp: parseFloat(match[8])
        });
        continue;
      }
    }
    if (board)
      boards.push(board);
    if (session)
      this.sessions.push(session);
  }
}

(function () {
  let travelings = Traveling.loadAll();
  fs.writeFileSync('data/combined.json',
                   JSON.stringify(travelings, null, 1));
})();
