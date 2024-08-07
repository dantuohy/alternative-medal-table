import React, { useEffect, useState } from "react";
import Papa from "papaparse";
import "./App.css";
import DataTable from "react-data-table-component";

function App() {
  const [tableData, setTableData] = useState([]);

  const columns = [
    {
      name: "",
      grow: 0,
      cell: (row) => (
        <img height="84px" width="56px" alt={row.name} src={row.flag} />
      ),
    },
    {
      name: "Name",
      selector: (row) => row.name,
      sortable: true,
    },
    {
      name: "Average - Rank",
      selector: (row) => row.average,
      sortable: true,
    },
    {
      name: "Total Score - Rank",
      selector: (row) => row.weightedRank,
      sortable: true,
    },
    {
      name: "Per Capita - Rank",
      selector: (row) => row.popRank,
      sortable: true,
    },
    {
      name: "GDP Per Capita - Rank",
      selector: (row) => row.gdpRank,
      sortable: true,
    },
    {
      name: "Gold - Count",
      selector: (row) => row.goldMedals,
      sortable: true,
    },
    {
      name: "Silver - Count",
      selector: (row) => row.silverMedals,
      sortable: true,
    },
    {
      name: "Bronze - Count",
      selector: (row) => row.bronzeMedals,
      sortable: true,
    },
    {
      name: "Medal Count",
      selector: (row) => row.totalMedals,
      sortable: true,
    },
  ];

  const GOLD_VAL = 3;
  const SILVER_VAL = 2;
  const BRONZE_VAL = 1;

  useEffect(() => {
    const fetch = async () => {
      var gdp = await GetData("data/gdp_per_capita.csv");
      var pop = await GetData("data/pop.csv");
      var med = await fetchMedalTable();
      process(med, pop, gdp);
    };

    fetch();
  }, []);

  function process(medalData, popData, gdpData) {
    console.log(`medalData length: ${medalData.length}`);
    console.log(`popData length: ${popData.length}`);
    console.log(`gdpData length: ${gdpData.length}`);

    var results = [];

    medalData.forEach((medalWinner) => {
      var result = {
        flag: `//images.sports.gracenote.com/images/lib/basic/geo/country/flag/SVG/${medalWinner.n_NOCGeoID}.svg`,
        name: medalWinner.c_NOC,
        rank: medalWinner.rank,
        gdpRank: 0,
        goldMedals: medalWinner.n_Gold,
        silverMedals: medalWinner.n_Silver,
        bronzeMedals: medalWinner.n_Bronze,
        totalMedals: medalWinner.n_Total,
        totalScore:
          medalWinner.n_Gold * GOLD_VAL +
          medalWinner.n_Silver * SILVER_VAL +
          medalWinner.n_Bronze * BRONZE_VAL,
      };

      var pop = popData.find(
        (x) =>
          x["Country Name"] == medalWinner.c_NOC ||
          x["Country Code"] == medalWinner.c_NOCShort
      );
      if (pop && Object.hasOwn(pop, "2023")) {
        var population = pop["2023"];

        result.popScore = result.totalScore / population;
      } else {
        console.log(medalWinner.c_NOCShort);
        console.log(pop);
      }

      var gdp = gdpData.find(
        (x) =>
          x["Country Name"] == medalWinner.c_NOC ||
          x["Country Code"] == medalWinner.c_NOCShort
      );
      if (gdp && Object.hasOwn(gdp, "2023")) {
        var gpdPer = gdp["2023"];

        result.gdpScore = result.totalScore / gpdPer;
      } else {
        console.log(medalWinner.c_NOCShort);
        console.log(gdp);
      }

      results.push(result);
    });

    // Step 1: Sort the array in descending order based on the score
    results.sort((a, b) => b.popScore - a.popScore);

    // Step 2: Assign ranks based on the sorted order
    for (let i = 0; i < results.length; i++) {
      results[i].popRank = i + 1; // Rank starts from 1
    }

    // Step 1: Sort the array in descending order based on the score
    results.sort((a, b) => b.gdpScore - a.gdpScore);

    // Step 2: Assign ranks based on the sorted order
    for (let i = 0; i < results.length; i++) {
      results[i].gdpRank = i + 1; // Rank starts from 1
    }

    // Step 1: Sort the array in descending order based on the score
    results.sort((a, b) => b.totalScore - a.totalScore);

    // Step 2: Assign ranks based on the sorted order
    for (let i = 0; i < results.length; i++) {
      results[i].weightedRank = i + 1; // Rank starts from 1
    }

    // Step 1: Sort the array in descending order based on the score
    results.sort(
      (a, b) =>
        (a.popRank + a.gdpRank + a.weightedRank) / 3 -
        (b.popRank + b.gdpRank + b.weightedRank) / 3
    );

    // Step 2: Assign ranks based on the sorted order
    for (let i = 0; i < results.length; i++) {
      results[i].average = i + 1; // Rank starts from 1
    }

    setTableData(results);
    return true;
  }

  async function GetData(filePath) {
    var data = await fetchCsv(filePath);
    console.log(data);
    const csv = Papa.parse(data, {
      header: true,
    });

    return csv.data;
  }

  async function fetchMedalTable() {
    const response = await fetch(
      "https://api-gracenote.nbcolympics.com/svc/games_v2.svc/json/GetMedalTable_Season?competitionSetId=1&season=2024&languageCode=2"
    );
    var json = await response.json();
    return json.MedalTableNOC;
  }

  async function fetchCsv(filePath) {
    const response = await fetch(filePath);
    console.log(`read csv ${filePath}`);
    return await response.text();
  }

  return (
    tableData.length > 0 && (
      <div className="App">
        <link
          href="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/css/bootstrap.min.css"
          rel="stylesheet"
          integrity="sha384-1BmE4kWBq78iYhFldvKuhfTAU6auU8tT94WrHftjDbrCEXSU1oBoqyl2QvZ6jIW3"
          crossorigin="anonymous"
        ></link>
        <div
          //          style="background: url(https://bootstrapious.com/i/snippets/sn-static-header/background.jpg)"
          className="jumbotron bg-cover text-white heading"
        >
          <div className="container py-5 text-center">
            <h1 className="display-4 font-weight-bold">
              Paris 2024 - Alternative Medal Table
            </h1>
            <p className="font-italic mb-0">
              The alternative medal table for the 2024 Paris Olympic Games
              presents a comprehensive evaluation of country performances,
              incorporating traditional and novel metrics. It offers a
              multi-dimensional perspective on Olympic achievements, recognizing
              both absolute and relative performances.
            </p>
          </div>
        </div>

        <header className="App-header">
          <ul className="bullet-points">
            <li>
              <b>Average Ranking:</b> An overall ranking is calculated by
              averaging a country's position across all four ranking methods,
              offering a balanced view of Olympic success.
            </li>
            <li>
              <b>Total Score System:</b> Medals are assigned point values—3
              points for gold, 2 for silver, and 1 for bronze—creating a
              cumulative score that ranks countries based on overall medal
              achievements.
            </li>
            <li>
              <b>Medals Per Capita:</b> This ranking adjusts the total score by
              the population of each country, highlighting the relative
              performance of smaller nations.
            </li>
            <li>
              <b>Medals per GDP Per Capita:</b> This metric evaluates countries
              by their total score in relation to their GDP per capita,
              providing insight into the efficiency of their Olympic programs
              relative to economic strength.
            </li>
            <li>
              <b>Traditional Ranking System:</b> Countries are ranked primarily
              by the number of gold medals won, with silver and bronze used as
              tiebreakers.
            </li>
          </ul>
        </header>
        <body>
          <div className="table">
            <DataTable
              height={true}
              fixedHeader={true}
              columns={columns}
              data={tableData}
            />
          </div>
        </body>
      </div>
    )
  );
}

export default App;
