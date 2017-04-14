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
    this.sessions = data.urls.map(url => {
      let text = fs.readFileSync('data/' + url);
      return this.parse(text.toString());
    });
    return this;
  }

  parse(text) {
    let lines = text.split('\n');
    let linenum = 0;
    let name = null;
    let session = 0;
    let board = 0;
    let scores = [];
    let boards = [];
    for (let line of lines) {
      linenum++;
      if (!session) {
        let sessionMatch = line.match(/^Session (\d+)/);
        if (sessionMatch) {
          session = sessionMatch[1];
          if (linenum >= 2)
            name = lines[linenum - 2];
        }
        continue;
      }
      let boardMatch = line.match(/^Board \((\d+)\)/);
      if (boardMatch) {
        if (board) {
          boards.push({ board: board, scores: scores });
          scores = [];
        }
        board = boardMatch[1];
        continue;
      }
      let scoreMatch = line.match(/^ ([ \d]{3}) ([ \d]{3}) (\d\w{1,2}) +(\w) ?([-\d]+) ([ \d]{4}) ([ \d]{4}) ([ \d\.]{6})/);
      if (scoreMatch) {
        scores.push({
          nsid: scoreMatch[1],
          ewid: scoreMatch[2],
          contract: scoreMatch[3],
          by: scoreMatch[4],
          make: parseInt(scoreMatch[5]),
          nsscore: scoreMatch[6].trim() ? parseInt(scoreMatch[6]) : 0,
          ewscore: scoreMatch[7].trim() ? parseInt(scoreMatch[7]) : 0,
          mp: parseFloat(scoreMatch[8])
        });
      }
    }
    if (board) {
      boards.push({ board: board, scores: scores });
    }
    return {
      session: session,
      boards: boards
    };
  }
}

(function () {
  let travelings = Traveling.loadAll();
  fs.writeFileSync('data/combined.json',
                   JSON.stringify(travelings, null, 1));
})();
