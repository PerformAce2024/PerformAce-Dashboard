import { getDb } from "../config/db.js";
import { ObjectId } from "mongodb";
import { regionToStateMapping, aggregateRegionDataByState } from "./mapping.js";

// Domain UID mapping
const domainMapping = {
  57661346: "timesnowhindi.com",
  57920111: "sportzwiki.com",
  57833538: "dailyhunt.in.reg",
  57822073: "dailyhunt.in.hi",
  57932135: "til.indiatimes.com",
  57658769: "timesnowhindi.com",
  57922924: "sportzwiki.com",
  57923343: "timesnowhindi.com",
  57848139: "thanthitv.com",
  57809465: "dailyhunt.in",
  57822075: "dailyhunt.in.ta",
  57925298: "uptak.in",
  57801260: "rajasthantak.com",
  57577098: "madhyamam.com",
  57969090: "madhyamam.com",
  57747607: "xandr.com.in",
  57744315: "ibc24.in",
  57872664: "timesnowhindi.com",
  57911484: "tazahindisamachar.com",
  57881008: "tradebrains.in",
  57853296: "gujarattak.in",
  57456282: "timesnownews.com",
  57969077: "timesnownews.com",
  57965358: "hindi.webdunia.com",
  57961892: "hindi.webdunia.com",
  57643494: "timesnownews.com",
  57969076: "timesnownews.com",
  57926760: "freepressjournal.in",
  57744316: "ibc24.in",
  57969089: "madhyamam.com",
  57822074: "dailyhunt.in.te",
  57923342: "timesnowhindi.com",
  57906435: "oneindia.com",
  57772193: "ghamasan.com",
  57886752: "timesnownews.com",
  57969113: "olx.in",
  57759659: "timesnownews.com",
  57920112: "sportzwiki.com",
  57768957: "etnownews.com",
  57916207: "uptak.in",
  57923209: "mptak.in",
  57975608: "hindi.webdunia.com",
  57665143: "mediaoneonline.com",
  57954441: "madhyamam.com",
  57961879: "hindi.webdunia.com",
  57742264: "odiascraps.info",
  57901998: "dtnext.in",
  57660344: "dfp.timesnownews.com",
  57913464: "freepressjournal.in",
  57950133: "mid-day.com",
  57925536: "timesnownews.com",
  57978566: "hindi.webdunia.com",
  57884362: "tamil.timesnownews.com",
  57853281: "uptak.in",
  57577097: "madhyamam.com",
  57853290: "uptak.in",
  57974979: "uptak.in",
  57969088: "timesnowmarathi.com",
  57456410: "timesnowmarathi.com",
  57920774: "crimetak.in",
  57974977: "uptak.in",
  57969087: "timesnowmarathi.com",
  57853291: "mumbaitak.in",
  57926933: "rajyasameeksha.com",
  57966337: "hindi.webdunia.com",
  57842320: "sarkariexam.com",
  57801263: "gujarattak.in",
  57872189: "freepressjournal.in",
  57851333: "kashishnews.com",
  57293949: "kannadaprabha.com",
  57798642: "atalsamachar.com",
  57456279: "timesnownews.com",
  57661849: "newindianexpress.com",
  57665146: "mediaoneonline.com",
  57969092: "tradebrains.in",
  57447834: "mumbailive.com",
  57879871: "tradebrains.in",
  57920822: "gujarattak.in",
  57561126: "daijiworld.com",
  57925319: "hindi.opindia.com",
  57976264: "republicworld.com",
  57101995: "newindianexpress.com",
  57772173: "janamtv.com",
  57948500: "republicworld.com",
  57923783: "new.timesbull.com",
  57961906: "marathi.webdunia.com",
  57943126: "maalaimalar.com",
  57803234: "xandr.com.in",
  57032221: "aninews.in",
  57963578: "madhyamam.com",
  57963554: "mptak.in",
  57969091: "tradebrains.in",
  57841054: "thanthitv.com",
  57920771: "mumbaitak.in",
  57915725: "ibtimes.co.in",
  57865846: "timesnowmarathi.com",
  57853283: "crimetak.in",
  57842318: "sarkariexam.com",
  57456257: "timesnownews.com",
  57974953: "sarkariexam.com",
  57974954: "sarkariexam.com",
  57841335: "maalaimalar.com",
  57744311: "ibc24.in",
  57530672: "bartamanpatrika.com",
  57920821: "rajasthantak.com",
  57499829: "saamana.com",
  57744132: "ibc24.in",
  57975607: "hindi.webdunia.com",
  57204463: "dinamani.com",
  57886092: "timesnowhindi.com",
  57923353: "timesnowhindi.com",
  57974960: "ibc24.in",
  57926329: "til.indiatimes.com",
  57963573: "hindi.opindia.com",
  57456375: "timesnowhindi.com",
  57951294: "republicworld.com",
  57744133: "ibc24.in",
  57961871: "hindi.webdunia.com",
  57456374: "timesnowhindi.com",
  57974278: "hindi.webdunia.com",
  57878256: "timesnownews.com",
  57965379: "tamil.webdunia.com",
  57961886: "marathi.webdunia.com",
  57577099: "madhyamam.com",
  57841337: "thanthitv.com",
  57768956: "etnownews.com",
  57961891: "hindi.webdunia.com",
  57499830: "saamana.com",
  57875716: "sarkariexam.com",
  57969080: "etnownews.com",
  57920083: "cricketaddictor.com",
  57841052: "maalaimalar.com",
  57961881: "tamil.webdunia.com",
  57857581: "etnownews.com",
  57456259: "timesnownews.com",
  57906033: "thecricketlounge.com",
  57950132: "mid-day.com",
  57756762: "etnownews.com",
  57756763: "etnownews.com",
  57800618: "raftaar.in",
  57969079: "etnownews.com",
  57836919: "update.timesnownews.com",
  57447816: "mumbailive.com",
  57369210: "mid-day.com",
  57834105: "popxo.com",
  57920743: "aninews.in",
  57456412: "timesnowmarathi.com",
  57855451: "etnownewshindi.com",
  57848127: "kashishnews.com",
  57956836: "maalaimalar.com",
  57965388: "marathi.webdunia.com",
  57801259: "rajasthantak.com",
  57963579: "madhyamam.com",
  57916222: "opindia.com",
  57974959: "ibc24.in",
  57916201: "newstak.in",
  57883704: "bartamanpatrika.com",
  57974283: "telugu.webdunia.com",
  57742648: "bollywoodhungama.com",
  57447829: "mumbailive.com",
  57884363: "tamil.timesnownews.com",
  57961896: "tamil.webdunia.com",
  57808498: "update.timesnownews.com",
  57456401: "timesnowmarathi.com",
  57842319: "sarkariexam.com",
  57925417: "etnownews.com",
  57884359: "tamil.timesnownews.com",
  57808513: "update.timesnownews.com",
  57925537: "timesnownews.com",
  57749172: "etnownews.com",
  57968667: "mid-day.com",
  57293927: "newindianexpress.com",
  57966333: "odiascraps.info",
  57914442: "opindia.com",
  57969085: "freepressjournal.in",
  57961898: "gujarati.webdunia.com",
  57102131: "dinamani.com",
  57679770: "timesnowhindi.com",
  57878262: "update.timesnownews.com",
  57293947: "kannadaprabha.com",
  57872188: "freepressjournal.in",
  57810143: "etnownews.com",
  57785808: "marathi.latestly.com",
  57690366: "mangalam.com",
  57850369: "ibc24.in",
  57961905: "marathi.webdunia.com",
  57792361: "daijiworld.com",
  57770008: "mid-day.com",
  57767298: "latestly.com",
  57874588: "freepressjournal.in",
  57920113: "hindnow.com",
  57969084: "freepressjournal.in",
  57834012: "scoopwhoop.com",
  57941255: "mid-day.com",
  57940608: "update.timesnownews.com",
  57923205: "mptak.in",
  57963552: "mptak.in",
  57961900: "telugu.webdunia.com",
  57834109: "hindi.scoopwhoop.com",
  57925534: "timesnowmarathi.com",
  56990832: "jagran.com",
  57961895: "tamil.webdunia.com",
  57679781: "timesnowhindi.com",
  57925535: "timesnownews.com",
  57057345: "aninews.in",
  57835811: "update.timesnownews.com",
  57102129: "dinamani.com",
  57557102: "daijiworld.com",
  57600807: "tellychakkar.com",
  57961873: "tamil.webdunia.com",
  57758840: "bollywoodhungama.com",
  57971666: "marathi.webdunia.com",
  57742265: "odiascraps.info",
  57661851: "newindianexpress.com",
  57965383: "telugu.webdunia.com",
  57961882: "gujarati.webdunia.com",
  57661846: "newindianexpress.com",
  57879507: "mangalam.com",
  57961883: "telugu.webdunia.com",
  57679778: "timesnowhindi.com",
  57808508: "update.timesnownews.com",
  57888556: "sarkariexam.com",
  57800616: "raftaar.in",
  57447814: "mumbailive.com",
  57643559: "mumbaitak.in",
  57982022: "hindi.webdunia.com",
  57741925: "vikramuniv.net",
  57896916: "popxo.com",
  57834017: "popxo.com",
  57600805: "tellychakkar.com",
  57965972: "update.timesnownews.com",
  57648899: "hindi.crictracker.com",
  57647661: "dinamani.com",
  57921936: "cricketaddictor.com",
  57834103: "scoopwhoop.com",
  57961899: "telugu.webdunia.com",
  57800620: "raftaar.in",
  57057340: "aninews.in",
  57969154: "hindnow.com",
  57692805: "affinity.rediff.com",
  57965381: "gujarati.webdunia.com",
  57712178: "ibc24.in",
  57798643: "atalsamachar.com",
  57961878: "marathi.webdunia.com",
  57834015: "hindi.scoopwhoop.com",
  57834104: "popxo.com",
  57841058: "thanthitv.com",
  57865847: "etnownewshindi.com",
  57111740: "dinamani.com",
  57718999: "bartamanpatrika.com",
  57919517: "banglahunt.com",
  57919470: "banglahunt.com",
  57580205: "thebegusarai.in",
  57982016: "tamil.webdunia.com",
  57961901: "malayalam.webdunia.com",
  57600827: "radioandmusic.com",
  57600831: "radioandmusic.com",
  57910815: "hauterrfly.com",
  57948505: "republicworld.com",
  57952323: "tradebrains.in",
  57907973: "indiahood.com",
  57857565: "etnownewshindi.com",
  57912743: "freepressjournal.in",
  57660350: "dfp.timesnownews.com",
  57965357: "english.webdunia.com",
  57982039: "marathi.webdunia.com",
  57772161: "jagbani.punjabkesari.in",
  57857082: "hindi.webdunia.com",
  57961880: "english.webdunia.com",
  57796651: "kannadaprabha.com",
  57772223: "telugu.webdunia.com",
  57949305: "mediaoneonline.com",
  57712278: "punjabkesari.in",
  57912772: "maalaimalar.com",
  57925473: "jagbani.punjabkesari.in",
  56990835: "jagranjosh.com",
  57907219: "filmibeat.com",
  57600828: "radioandmusic.com",
  57949377: "update.timesnownews.com",
  57536203: "newstrend.news",
  57865554: "thebharatnama.com",
  57272050: "hindi.webdunia.com",
  57511681: "viralsandesh.com",
  57961894: "english.webdunia.com",
  57850374: "ibc24.in",
  57719443: "mid-day.com",
  57600826: "radioandmusic.com",
  57936924: "new.timesbull.com",
  57896422: "ibtimes.sg",
  57952334: "mid-day.com",
  56990834: "jagranjosh.com",
  57712276: "punjabkesari.in",
  57982026: "telugu.webdunia.com",
  57969082: "banglahunt.com",
  57516780: "ibtimes.co.in",
  57345797: "opindia.com",
  57679786: "zoomtventertainment.com",
  57982025: "gujarati.webdunia.com",
  57854713: "sarkariexam.com",
  57982021: "marathi.webdunia.com",
  57272112: "tamil.webdunia.com",
  57765986: "teluguone.com",
  57001010: "naidunia.jagran.com",
  56990840: "naidunia.jagran.com",
  57955364: "aninews.in",
  57102134: "dinamani.com",
  57273275: "marathi.webdunia.com",
  57704689: "punjabkesari.in",
  57704687: "punjabkesari.in",
  57456922: "businessworld.in",
  57974286: "marathi.webdunia.com",
  57865849: "timesfoodie.com",
  57961877: "kannada.webdunia.com",
  57936620: "wikiwiki.in",
  57661841: "newindianexpress.com",
  57456355: "zoomtventertainment.com",
  57925560: "zoomtventertainment.com",
  57761508: "bollywoodlivehd.com",
  57949307: "bollywoodhungama.com",
  57721630: "manoramanews.com",
  57780443: "bollywoodlivehd.com",
  57897273: "timesnowmarathi.com",
  57647653: "newindianexpress.com",
  57260919: "aninews.in",
  57925558: "zoomtventertainment.com",
  57660912: "wikiwiki.in",
  57001015: "jagranjosh.com",
  57272121: "gujarati.webdunia.com",
  57961876: "malayalam.webdunia.com",
  57917491: "tazahindisamachar.com",
  57966476: "kamadenu.in",
  57780456: "ind.timesofindia.com",
  57505196: "mumbailive.com",
  57940357: "jagbani.punjabkesari.in",
  57537840: "vikatan.com",
  57772164: "bollywoodtadka.in",
  57826442: "raftaar.in",
  57456356: "zoomtventertainment.com",
  57880623: "ibtimes.co.in",
  57830776: "xandr.com.in",
  57729998: "wikiwiki.in",
  57772219: "tamil.webdunia.com",
  57889154: "new.timesbull.com",
  57272063: "hindi.webdunia.com",
  57345796: "opindia.com",
  57001012: "jagranjosh.com",
  57858425: "news.vikramuniv.net",
  57643577: "thesportstak.com",
  57293950: "kannadaprabha.com",
  57974281: "tamil.webdunia.com",
  57897272: "timesnowmarathi.com",
  57874446: "mindofall.com",
  57841778: "radioandmusic.com",
  57981948: "telugu.webdunia.com",
  57961872: "english.webdunia.com",
  57961903: "kannada.webdunia.com",
  57953575: "mindofall.com",
  57827898: "techballad.com",
  57664220: "ntvtelugu.com",
  57968074: "voiceofbihar.in",
  57981943: "tamil.webdunia.com",
  57855453: "etnownewshindi.com",
  57456919: "businessworld.in",
  57895903: "uttranews.com",
  57907189: "goodreturns.in",
  57974279: "english.webdunia.com",
  57589649: "bartamanpatrika.com",
  57293952: "kannadaprabha.com",
  57982027: "malayalam.webdunia.com",
  5639612: "deguate.com",
  57097148: "stimhardytest.com",
  57102179: "samakalikamalayalam.com",
  57119801: "indiatimemail.com",
  57345805: "janamtv.com",
  57523311: "gazetaexpress.com",
  57525817: "bunko.pet",
  57595565: "quini.com.ar",
  57607050: "ghamasan.com",
  57609080: "adokut.com",
  57669238: "newstracklive.com",
  57687264: "lhkmedia.in",
  57756437: "hueads.com",
  57780241: "mahendraindianews.com",
  57780257: "publicnewstv.in",
  57798073: "claudia.abril.com.br",
  57804428: "vocaldaily.com",
  57826590: "timesinternet.in",
  57842567: "newsheight.com",
  57846472: "timesinternet.in",
  57846509: "timesinternet.in",
  57860754: "kalkionline.com",
  57867431: "mixupdates.com",
  57875110: "vocaldaily.com",
  57876187: "ilovenovels.com",
  57893831: "tisoomi.com",
  57907343: "in.buzzday.info",
  57916941: "thequenews.com",
  57928084: "updateyouth.com",
  57931655: "til.indiatimes.com",
  57931658: "til.indiatimes.com",
  57931659: "til.indiatimes.com",
  57932054: "rujukannews.com",
  57936326: "indiah1.com",
  57948243: "unibots.toonclash.com",
  57955813: "navinsamachar.com",
  57971670: "timesharyana.in",
  57976367: "newzindialive.com",
  57976950: "govtnewsindia.com",
  57977448: "autonewz.co.in",
  5639612: "deguate.com",
  57097148: "stimhardytest.com",
  57102179: "samakalikamalayalam.com",
  57119801: "indiatimemail.com",
  57345805: "janamtv.com",
  57523311: "gazetaexpress.com",
  57525817: "bunko.pet",
  57595565: "quini.com.ar",
  57607050: "ghamasan.com",
  57609080: "adokut.com",
  57669238: "newstracklive.com",
  57687264: "lhkmedia.in",
  57756437: "hueads.com",
  57780241: "mahendraindianews.com",
  57780257: "publicnewstv.in",
  57798073: "claudia.abril.com.br",
  57804428: "vocaldaily.com",
  57826590: "timesinternet.in",
  57842567: "newsheight.com",
  57846472: "timesinternet.in",
  57846509: "timesinternet.in",
  57860754: "kalkionline.com",
  57867431: "mixupdates.com",
  57875110: "vocaldaily.com",
  57876187: "ilovenovels.com",
  57893831: "tisoomi.com",
  57907343: "in.buzzday.info",
  57916941: "thequenews.com",
  57928084: "updateyouth.com",
  57931655: "til.indiatimes.com",
  57931658: "til.indiatimes.com",
  57931659: "til.indiatimes.com",
  57932054: "rujukannews.com",
  57936326: "indiah1.com",
  57948243: "unibots.toonclash.com",
  57955813: "navinsamachar.com",
  57971670: "timesharyana.in",
  57976367: "newzindialive.com",
  57976950: "govtnewsindia.com",
  57977448: "autonewz.co.in",
};

export async function transformMgidData(campaignId, startDate, endDate) {
  let client;
  try {
    client = await getDb();
    const collection = client.collection("mgidData");

    const query = {
      campaign_id: campaignId,
      $or: [
        {
          "date_range.from": startDate,
          "date_range.to": endDate,
        },
        {
          date_value: {
            $gte: startDate,
            $lte: endDate,
          },
        },
      ],
    };

    const mgidData = await collection.find(query).toArray();

    if (mgidData.length === 0) {
      throw new Error(
        `No data found for campaign ${campaignId} between ${startDate} and ${endDate}`
      );
    }

    // Process Summary data with aggregation
    const summaryData = mgidData
      .filter((record) => record.category === "Summary")
      .reduce((acc, curr) => {
        const dateKey = curr[" Date"];
        if (!acc[dateKey]) {
          acc[dateKey] = {
            date: dateKey,
            impressions: 0,
            clicks: 0,
            spent: 0,
            actions: 0,
          };
        }

        acc[dateKey].impressions +=
          parseInt(
            curr["                         Imps                          "]
          ) || 0;
        acc[dateKey].clicks += parseInt(curr["Clicks"]) || 0;
        acc[dateKey].spent += parseFloat(curr["Spent, INR"]) || 0;
        acc[dateKey].actions += parseInt(curr["Actions"]) || 0;
        acc[dateKey].ctr = (
          (acc[dateKey].clicks / acc[dateKey].impressions) *
          100
        ).toFixed(2);
        acc[dateKey].cpc = (acc[dateKey].spent / acc[dateKey].clicks).toFixed(
          2
        );

        return acc;
      }, {});

    const transformedData = {
      endDate,
      startDate,
      campaignId,
      campaignPerformanceResult: {
        "last-used-rawdata-update-time": `${endDate} 11:30:00.0`,
        "last-used-rawdata-update-time-gmt-millisec": new Date(
          endDate
        ).getTime(),
        timezone: "IST",
        results: Object.values(summaryData),
        recordCount: mgidData.length,
        metadata: {
          dateStored: new Date().toISOString(),
        },
      },
      performanceByBrowser: {},
      performanceByCountry: {},
      performanceByOS: {},
      performanceByRegion: {},
      performanceByAds: {},
      performanceByDomain: {},
    };

    // Process other categories
    const categoryMap = {
      Browser: "performanceByBrowser",
      Country: "performanceByCountry",
      OS: "performanceByOS",
      region: "performanceByRegion",
      Ads: "performanceByAds",
      Domain: "performanceByDomain",
    };

    mgidData.forEach((record) => {
      if (record.category !== "Summary" && categoryMap[record.category]) {
        const key = categoryMap[record.category];
        const dateKey = record.date_value || record[" Date"];

        if (!transformedData[key][dateKey]) {
          transformedData[key][dateKey] = [];
        }

        const { category, campaign_id, date_range, ...rest } = record;

        if (record.category === "region") {
          transformedData[key][dateKey].push(rest);
        } else if (record.category === "Domain" && rest["Widget UID"]) {
          const widgetUid = rest["Widget UID"];
          const siteName = domainMapping[widgetUid] || widgetUid;
          rest.site = siteName;
          delete rest["Widget UID"];
          transformedData[key][dateKey].push(rest);
        } else {
          transformedData[key][dateKey].push(rest);
        }
      }
    });

    Object.keys(transformedData.performanceByRegion).forEach((dateKey) => {
      const regionData = transformedData.performanceByRegion[dateKey];
      transformedData.performanceByRegion[dateKey] =
        aggregateRegionDataByState(regionData);
    });
    client = await getDb();
    const transformedCollection = client.collection(
      "mgid_transformed_data_final"
    );

    const existingDoc = await transformedCollection.findOne({
      campaignId,
      startDate,
      endDate,
    });

    let result;
    if (existingDoc) {
      await transformedCollection.updateOne(
        { _id: existingDoc._id },
        { $set: transformedData }
      );
      result = { ...transformedData, _id: existingDoc._id };
    } else {
      const newDoc = { ...transformedData, _id: new ObjectId() };
      await transformedCollection.insertOne(newDoc);
      result = newDoc;
    }

    return result;
  } catch (error) {
    console.error("Error in transformMgidData:", error);
    throw error;
  } finally {
    if (client) {
      await client.close();
    }
  }
}
