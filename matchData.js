
function getMatchDetailsById(matchId) {
  const matchesData = {
          "0": {
            id: "0",
            group: "??",
            homeTeam: "???",
            awayTeam: "???",
            homeScore: 0,
            awayScore: 0,
            date: "2025-??-??",
            league: "호실축구",
            status: "scheduled",
            stats: {
                homePossession: 0,
                awayPossession: 0,
                homeShots: 0,
                awayShots: 0
            },
            events: [
            ],
            lineups: {
                home: {
                    third: ["1"],
                    second: ["2", "3", "4", "5", "9", "10", "11"],
                    first: ["6", "7", "8"],
                },
                away: {
                    third: ["12"],
                    second:["13", "14", "15", "16"],
                    first: ["17", "18", "19"],
                }
            }
        },
        "1": {
            id: "1",
            group: "1조",
            homeTeam: "C307",
            awayTeam: "C302",
            homeScore: 0,
            awayScore: 1,
            date: "2025-03-17",
            league: "호실축구",
            status: "finished",
            stats: {
                homePossession: 55,
                awayPossession: 45,
                homeShots: 12,
                awayShots: 8
            },
            events: [
            ],
            lineups: {
                home: {
                    third: ["1"],
                    second: ["2", "3", "4", "5"],
                    first: ["6", "7", "8"],
                },
                away: {
                    third: ["12"],
                    second:["13", "14", "15", "16"],
                    first: ["17", "18", "19"],
                }
            }
        },
        "2": {
            id: "2",
            homeTeam: "C102",
            awayTeam: "C101",
            homeScore: 0,
            awayScore: 0,
            date: "2025-03-18",
            league: "호실축구",
            status: "cancelled",
            stats: {
                homePossession: 40,
                awayPossession: 60,
                homeShots: 5,
                awayShots: 15
            },
            events: [
            ],
            lineups: {
                home: {
                    third: ["1"],
                    second: ["2", "3", "4", "5"],
                    first: ["6", "7", "8"],
                },
                away: {
                    third: ["12"],
                    second: ["13", "14", "15", "16"],
                    first: ["17", "18", "19"],
                }
            }
        },
        "3": {
            id: "3",
            homeTeam: "C201",
            awayTeam: "C207",
            homeScore: 4,
            awayScore: 2,
            date: "2025-03-19",
            league: "호실축구",
            status: "finished",
            stats: {
                homePossession: 50,
                awayPossession: 50,
                homeShots: 7,
                awayShots: 7
            },
            events: [
            ],
            lineups: {
                home: {
                    third: ["1"],
                    second: ["2", "3", "4", "5"],
                    first: ["6", "7", "8"],
                },
                away: {
                    third: ["12"],
                    second: ["13", "14", "15", "16"],
                    first: ["17", "18", "19"],
                }
            }
        },
        "4": {
            id: "4",
            homeTeam: "C104",
            awayTeam: "C306",
            homeScore: 0,
            awayScore: 0,
            date: "2025-03-20",
            league: "호실축구",
            status: "cancelled",
            stats: {
                homePossession: 50,
                awayPossession: 50,
                homeShots: 0,
                awayShots: 0
            },
            events: [],
            lineups: {
                home: {
                    third: ["1"],
                    second: ["2", "3", "4", "5"],
                    first: ["6", "7", "8"],
                },
                away: {
                    third: ["12"],
                    second: ["13", "14", "15", "16"],
                    first: ["17", "18", "19"],
                }
            }
        },
        "5": {
            id: "5",
            homeTeam: "C103",
            awayTeam: "C204",
            homeScore: 0,
            awayScore: 2,
            date: "2025-03-21",
            league: "호실축구",
            status: "finished",
            stats: {
                homePossession: 50,
                awayPossession: 50,
                homeShots: 0,
                awayShots: 0
            },
            events: [],
            lineups: {
                home: {
                    third: ["1"],
                    second: ["2", "3", "4", "5"],
                    first: ["6", "7", "8"],
                },
                away: {
                    third: ["12"],
                    second: ["13", "14", "15", "16"],
                    first: ["17", "18", "19"],
                }
            }
        },

        "6": {
            id: "6",
            homeTeam: "C202",
            awayTeam: "C203",
            homeScore: 0,
            awayScore: 0,
            date: "2025-03-24",
            league: "호실축구",
            status: "cancelled",
            stats: {
                homePossession: 50,
                awayPossession: 50,
                homeShots: 0,
                awayShots: 0

            },
            events: [],
            lineups: {
                home: {
                    third: ["1"],
                    second: ["2", "3", "4", "5"],
                    first: ["6", "7", "8"],
                },
                away: {
                    third: ["12"],
                    second: ["13", "14", "15", "16"],
                    first: ["17", "18", "19"],
                }
            }
        },
        "7": {
            id: "7",
            group: "1조",
            homeTeam: "C105",
            awayTeam: "C106",
            homeScore: 1,
            awayScore: 3,
            date: "2025-03-27",
            league: "호실축구",
            status: "finished",
            stats: {
                homePossession: 55,
                awayPossession: 45,
                homeShots: 12,
                awayShots: 8
            },
            events: [
            ],
            lineups: {
                home: {
                    third: ["1"],
                    second: ["2", "3", "4", "5"],
                    first: ["6", "7", "8"],
                },
                away: {
                    third: ["12"],
                    second:["13", "14", "15", "16"],
                    first: ["17", "18", "19"],
                }
            }
        },
        "8": {
            id: "8",
            homeTeam: "C206",
            awayTeam: "C307",
            homeScore: 1,
            awayScore: 2,
            date: "2025-03-28",
            league: "호실축구",
            status: "finished",
            stats: {
                homePossession: 40,
                awayPossession: 60,
                homeShots: 5,
                awayShots: 15
            },
            events: [
            ],
            lineups: {
                home: {
                    third: ["1"],
                    second: ["2", "3", "4", "5"],
                    first: ["6", "7", "8"],
                },
                away: {
                    third: ["12"],
                    second: ["13", "14", "15", "16"],
                    first: ["17", "18", "19"],
                }
            }
        },
        "9": {
            id: "9",
            homeTeam: "C305",
            awayTeam: "C102",
            homeScore: 1,
            awayScore: 1,
            date: "2025-04-07",
            league: "호실축구",
            status: "finished",
            stats: {
                homePossession: 50,
                awayPossession: 50,
                homeShots: 7,
                awayShots: 7
            },
            events: [
            ],
            lineups: {
                home: {
                    third: ["1"],
                    second: ["2", "3", "4", "5"],
                    first: ["6", "7", "8"],
                },
                away: {
                    third: ["12"],
                    second: ["13", "14", "15", "16"],
                    first: ["17", "18", "19"],
                }
            }
        },
        "10": {
            id: "10",
            homeTeam: "C205",
            awayTeam: "C201",
            homeScore: 1,
            awayScore: 8,
            date: "2025-04-08",
            league: "호실축구",
            status: "finished",
            stats: {
                homePossession: 50,
                awayPossession: 50,
                homeShots: 0,
                awayShots: 0
            },
            events: [],
            lineups: {
                home: {
                    third: ["1"],
                    second: ["2", "3", "4", "5"],
                    first: ["6", "7", "8"],
                },
                away: {
                    third: ["12"],
                    second: ["13", "14", "15", "16"],
                    first: ["17", "18", "19"],
                }
            }
        },
        "11": {
            id: "11",
            homeTeam: "C304",
            awayTeam: "C104",
            homeScore: 2,
            awayScore: 1,
            date: "2025-04-09",
            league: "호실축구",
            status: "finished",
            stats: {
                homePossession: 50,
                awayPossession: 50,
                homeShots: 0,
                awayShots: 0
            },
            events: [],
            lineups: {
                home: {
                    third: ["1"],
                    second: ["2", "3", "4", "5"],
                    first: ["6", "7", "8"],
                },
                away: {
                    third: ["12"],
                    second: ["13", "14", "15", "16"],
                    first: ["17", "18", "19"],
                }
            }
        },

        "12": {
            id: "12",
            homeTeam: "C302",
            awayTeam: "C103",
            homeScore: 4,
            awayScore: 0,
            date: "2025-04-10",
            league: "호실축구",
            status: "finished",
            stats: {
                homePossession: 50,
                awayPossession: 50,
                homeShots: 0,
                awayShots: 0

            },
            events: [],
            lineups: {
                home: {
                    third: ["1"],
                    second: ["2", "3", "4", "5"],
                    first: ["6", "7", "8"],
                },
                away: {
                    third: ["12"],
                    second: ["13", "14", "15", "16"],
                    first: ["17", "18", "19"],
                }
            }
        },
        "13": {
            id: "13",
            group: "1조",
            homeTeam: "C101",
            awayTeam: "C202",
            homeScore: 1,
            awayScore: 2,
            date: "2025-04-11",
            league: "호실축구",
            status: "finished",
            stats: {
                homePossession: 55,
                awayPossession: 45,
                homeShots: 12,
                awayShots: 8
            },
            events: [
            ],
            lineups: {
                home: {
                    third: ["1"],
                    second: ["2", "3", "4", "5"],
                    first: ["6", "7", "8"],
                },
                away: {
                    third: ["12"],
                    second:["13", "14", "15", "16"],
                    first: ["17", "18", "19"],
                }
            }
        },
        "14": {
            id: "14",
            homeTeam: "C207",
            awayTeam: "C301",
            homeScore: 2,
            awayScore: 3,
            date: "2025-05-19",
            league: "호실축구",
            status: "finished",
            stats: {
                homePossession: 40,
                awayPossession: 60,
                homeShots: 5,
                awayShots: 15
            },
            events: [
            ],
            lineups: {
                home: {
                    third: ["1"],
                    second: ["2", "3", "4", "5"],
                    first: ["6", "7", "8"],
                },
                away: {
                    third: ["12"],
                    second: ["13", "14", "15", "16"],
                    first: ["17", "18", "19"],
                }
            }
        },
        "15": {
            id: "15",
            homeTeam: "C306",
            awayTeam: "C105",
            homeScore: 4,
            awayScore: 1,
            date: "2025-05-20",
            league: "호실축구",
            status: "finished",
            stats: {
                homePossession: 50,
                awayPossession: 50,
                homeShots: 7,
                awayShots: 7
            },
            events: [
            ],
            lineups: {
                home: {
                    third: ["1"],
                    second: ["2", "3", "4", "5"],
                    first: ["6", "7", "8"],
                },
                away: {
                    third: ["12"],
                    second: ["13", "14", "15", "16"],
                    first: ["17", "18", "19"],
                }
            }
        },
        "16": {
            id: "16",
            homeTeam: "C106",
            awayTeam: "C304",
            homeScore: 2,
            awayScore: 0,
            date: "2025-05-21",
            league: "호실축구",
            status: "finished",
            stats: {
                homePossession: 50,
                awayPossession: 50,
                homeShots: 0,
                awayShots: 0
            },
            events: [],
            lineups: {
                home: {
                    third: ["1"],
                    second: ["2", "3", "4", "5"],
                    first: ["6", "7", "8"],
                },
                away: {
                    third: ["12"],
                    second: ["13", "14", "15", "16"],
                    first: ["17", "18", "19"],
                }
            }
        },
        "17": {
            id: "17",
            homeTeam: "C204",
            awayTeam: "C206",
            homeScore: 10,
            awayScore: 1,
            date: "2025-05-22",
            league: "호실축구",
            status: "finished",
            stats: {
                homePossession: 50,
                awayPossession: 50,
                homeShots: 0,
                awayShots: 0
            },
            events: [],
            lineups: {
                home: {
                    third: ["1"],
                    second: ["2", "3", "4", "5"],
                    first: ["6", "7", "8"],
                },
                away: {
                    third: ["12"],
                    second: ["13", "14", "15", "16"],
                    first: ["17", "18", "19"],
                }
            }
        },
        "18": {
            id: "18",
            homeTeam: "C203",
            awayTeam: "C305",
            homeScore: 0,
            awayScore: 1,
            date: "2025-05-23",
            league: "호실축구",
            status: "finished",
            stats: {
                homePossession: 50,
                awayPossession: 50,
                homeShots: 0,
                awayShots: 0
            },
            events: [],
            lineups: {
                home: {
                    third: ["1"],
                    second: ["2", "3", "4", "5"],
                    first: ["6", "7", "8"],
                },
                away: {
                    third: ["12"],
                    second: ["13", "14", "15", "16"],
                    first: ["17", "18", "19"],
                }
            }
        },
        "19": {
            id: "19",
            homeTeam: "C303",
            awayTeam: "C205",
            homeScore: 2,
            awayScore: 1,
            date: "2025-05-27",
            league: "호실축구",
            status: "finished",
            stats: {
                homePossession: 50,
                awayPossession: 50,
                homeShots: 0,
                awayShots: 0
            },
            events: [],
            lineups: {
                home: {
                    third: ["1"],
                    second: ["2", "3", "4", "5"],
                    first: ["6", "7", "8"],
                },
                away: {
                    third: ["12"],
                    second: ["13", "14", "15", "16"],
                    first: ["17", "18", "19"],
                }
            }
        },

        "20": {
            id: "20",
            homeTeam: "C301",
            awayTeam: "C303",
            homeScore: 3,
            awayScore: 2,
            date: "2025-05-29",
            league: "호실축구",
            status: "scheduled",
            stats: {
                homePossession: 50,
                awayPossession: 50,
                homeShots: 0,
                awayShots: 0
            },
            events: [],
            lineups: {
                home: {
                    third: ["1"],
                    second: ["2", "3", "4", "5"],
                    first: ["6", "7", "8"],
                },
                away: {
                    third: ["12"],
                    second: ["13", "14", "15", "16"],
                    first: ["17", "18", "19"],
                }
            }
        },
        "21": {
            id: "21",
            homeTeam: "C102",
            awayTeam: "C101",
            homeScore: 3,
            awayScore: 1,
            date: "2025-03-31",
            league: "호실축구",
            status: "finished",
            stats: {
                homePossession: 50,
                awayPossession: 50,
                homeShots: 0,
                awayShots: 0
            },
            events: [],
            lineups: {
                home: {
                    third: ["1"],
                    second: ["2", "3", "4", "5"],
                    first: ["6", "7", "8"],
                },
                away: {
                    third: ["12"],
                    second: ["13", "14", "15", "16"],
                    first: ["17", "18", "19"],
                }
            }
        },
        "22": {
            id: "22",
            homeTeam: "C104",
            awayTeam: "C306",
            homeScore: 2,
            awayScore: 2,
            date: "2025-04-01",
            league: "호실축구",
            status: "finished",
            stats: {
                homePossession: 50,
                awayPossession: 50,
                homeShots: 0,
                awayShots: 0
            },
            events: [],
            lineups: {
                home: {
                    third: ["1"],
                    second: ["2", "3", "4", "5"],
                    first: ["6", "7", "8"],
                },
                away: {
                    third: ["12"],
                    second: ["13", "14", "15", "16"],
                    first: ["17", "18", "19"],
                }
            }
        },
        "23": {
            id: "23",
            homeTeam: "C202",
            awayTeam: "C203",
            homeScore: 1,
            awayScore: 1,
            date: "2025-04-02",
            league: "호실축구",
            status: "finished",
            stats: {
                homePossession: 50,
                awayPossession: 50,
                homeShots: 0,
                awayShots: 0
            },
            events: [],
            lineups: {
                home: {
                    third: ["1"],
                    second: ["2", "3", "4", "5"],
                    first: ["6", "7", "8"],
                },
                away: {
                    third: ["12"],
                    second: ["13", "14", "15", "16"],
                    first: ["17", "18", "19"],
                }
            }
        },
        "24": {
            id: "24",
            homeTeam: "C102",
            awayTeam: "C305",
            homeScore: 3,
            awayScore: 2,
            date: "2025-05-28",
            league: "호실축구",
            status: "finished",
            stats: {
                homePossession: 50,
                awayPossession: 50,
                homeShots: 0,
                awayShots: 0
            },
            events: [],
            lineups: {
                home: {
                    third: ["1"],
                    second: ["2", "3", "4", "5"],
                    first: ["6", "7", "8"],
                },
                away: {
                    third: ["12"],
                    second: ["13", "14", "15", "16"],
                    first: ["17", "18", "19"],
                }
            }
         },
         "25": {
             id: "25",
             homeTeam: "C106",
             awayTeam: "C302",
             homeScore: 1,
             awayScore: 0,
             date: "2025-06-09",
             league: "호실축구",
             status: "finished",
             stats: {
                 homePossession: 50,
                 awayPossession: 50,
                 homeShots: 0,
                 awayShots: 0
             },
             events: [],
             lineups: {
                 home: {
                    third: ["1"],
                    second: ["2", "3", "4", "5"],
                    first: ["6", "7", "8"],
                },
                 away: {
                    third: ["12"],
                    second: ["13", "14", "15", "16"],
                    first: ["17", "18", "19"],
                }
            }
        },
         "26": {
            id: "26",
            homeTeam: "C202",
            awayTeam: "C301",
            homeScore: 1,
            awayScore: 5,
            date: "2025-06-10",
            league: "호실축구",
            status: "finished",
            stats: {
                homePossession: 50,
                awayPossession: 50,
                homeShots: 0,
                awayShots: 0
            },
            events: [],
            lineups: {
                home: {
                    third: ["1"],
                    second: ["2", "3", "4", "5"],
                    first: ["6", "7", "8"],
                },
                away: {
                    third: ["12"],
                    second: ["13", "14", "15", "16"],
                    first: ["17", "18", "19"],
                }
            }
        },
         "27": {
            id: "27",
            homeTeam: "C202",
            awayTeam: "C302",
            homeScore: 2,
            awayScore: 3,
            date: "2025-06-12",
            league: "호실축구",
            status: "finished",
            stats: {
                homePossession: 50,
                awayPossession: 50,
                homeShots: 0,
                awayShots: 0
            },
            events: [],
            lineups: {
                home: {
                    third: ["1"],
                    second: ["2", "3", "4", "5"],
                    first: ["6", "7", "8"],
                },
                away: {
                    third: ["12"],
                    second: ["13", "14", "15", "16"],
                    first: ["17", "18", "19"],
                }
            }
        },
          "28": {
            id: "28",
            homeTeam: "C106",
            awayTeam: "C301",
            homeScore: 2,
            awayScore: 2,
            date: "2025-06-13",
            league: "호실축구",
            status: "finished",
            stats: {
                homePossession: 50,
                awayPossession: 50,
                homeShots: 0,
                awayShots: 0
            },
            events: [],
            lineups: {
                home: {
                    third: ["1"],
                    second: ["2", "3", "4", "5"],
                    first: ["6", "7", "8"],
                },
                away: {
                    third: ["12"],
                    second: ["13", "14", "15", "16"],
                    first: ["17", "18", "19"],
                }
            }
        },
          "29": {
            id: "29",
            group: "??",
            homeTeam: "???",
            awayTeam: "???",
            homeScore: 0,
            awayScore: 0,
            date: "2025-??-??",
            league: "호실축구",
            status: "scheduled",
            stats: {
                homePossession: 0,
                awayPossession: 0,
                homeShots: 0,
                awayShots: 0
            },
            events: [
            ],
            lineups: {
                home: {
                    third: ["1"],
                    second: ["2", "3", "4", "5"],
                    first: ["6", "7", "8"],
                },
                away: {
                    third: ["12"],
                    second:["13", "14", "15", "16"],
                    first: ["17", "18", "19"],
                }
            }
        },
          "30": {
            id: "30",
            group: "??",
            homeTeam: "???",
            awayTeam: "???",
            homeScore: 0,
            awayScore: 0,
            date: "2025-??-??",
            league: "호실축구",
            status: "scheduled",
            stats: {
                homePossession: 0,
                awayPossession: 0,
                homeShots: 0,
                awayShots: 0
            },
            events: [
            ],
            lineups: {
                home: {
                    third: ["1"],
                    second: ["2", "3", "4", "5"],
                    first: ["6", "7", "8"],
                },
                away: {
                    third: ["12"],
                    second:["13", "14", "15", "16"],
                    first: ["17", "18", "19"],
                }
            }
        }
    }

    const defaultMatch = {
        id: matchId,
        homeTeam: "알 수 없음",
        awayTeam: "알 수 없음",
        homeScore: 0,
        awayScore: 0,
        date: "날짜 정보 없음",
        league: "리그 정보 없음",
        status: "unknown",
        stats: {
            homePossession: 50,
            awayPossession: 50,
            homeShots: 0,
            awayShots: 0
        },
        events: [],
        lineups: {
            home: {
                gk: [""],
                df: ["", ""],
                mf: ["", "", ""],
                at: ["", ""]
            },
            away: {
                gk: [""],
                df: ["", ""],
                mf: ["", "", ""],
                at: ["", ""]
            }
        }
    };

    return matchesData[matchId] || defaultMatch;
  }
