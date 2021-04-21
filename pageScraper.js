

const ObjectsToCsv = require('objects-to-csv')

const scraperObject = {
  url: 'https://www.uncp.ffbatiment.fr/couverture-plomberie/annuaire/batiment.html',
  page: null,
  async scraper(browser) {
    this.page = await browser.newPage();
    let dep = "02";
    let activity = "704"
    let listActivite = ["704", "721", "734", "705", "707", "736", "706", "708", "709", "710", "740", "711", "712", "713", "714", "735", "715", "717", "718", "719", "737", "720", "741", "738", "733", "716", "739"];
    let listDep = ["01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12", "13", "14", "15", "16", "17", "18", "19", "21", "22", "23", "24", "25", "26", "27", "28", "29", "2A", "2B", "30", "31", "32", "33", "34", "35", "36", "37", "38", "39", "40", "41", "42", "43", "44", "45", "46", "47", "48", "49", "50", "51", "52", "53", "54", "55", "56", "57", "58", "59", "60", "61", "62", "63", "64", "65", "66", "67", "68", "69", "70", "71", "72", "73", "74", "75", "76", "77", "78", "79", "80", "81", "82", "83", "84", "85", "86", "87", "88", "89", "90", "91", "92", "93", "94", "95", "971", "973"];
    let listOfResult = []
    console.log("ReadFiles")
    var fs = require("fs");
    let tmpX = Number(fs.readFileSync("activity.txt", "utf8"));
    let tmpY = Number(fs.readFileSync("dep.txt", "utf8"));

    for (let x = tmpX; x < listActivite.length; x++) {
        console.log(`Saving Actual stage (activity ${x}`);
        fs.writeFileSync("activity.txt", "" + x);

      for (let y = tmpY; y < listDep.length; y++) {
                console.log(`Saving Actual stage (dep ${y}`);
        fs.writeFileSync("dep.txt", "" + y);
        let urlToScrap = this.url + "?&Dep=" + listDep[y] + "&Acti=" + listActivite[x]
        console.log(`Navigating to ${urlToScrap}...`);
        await this.page.close();
        this.page = await browser.newPage();
        await this.page.goto(urlToScrap);
        await this.page.click("#ctl00_ContentPlaceHolderContenu_Button1");
        await this.page.waitForSelector('#ctl00_ContentPlaceHolderContenu_EmptyDataText, #ctl00_ContentPlaceHolderContenu_RadGrid1_ctl00 > thead > tr.rgPager > td > div.CustomPagerHolder > h2');
        let productType = await this.page.evaluate(() => {
          let el = document.querySelector("#ctl00_ContentPlaceHolderContenu_EmptyDataText")
          return el ? el.innerText : ""
        });
        console.log(productType)
        if (productType === "" ||productType === "Aucune information disponible") {
          console.log("There is no result");
          continue;
        }
        let totalrow = await this.page.$eval("#ctl00_ContentPlaceHolderContenu_RadGrid1_ctl00 > thead > tr.rgPager > td > div.CustomPagerHolder > h2", element => element.innerHTML);
        totalrow = totalrow.split(":");
        totalrow = totalrow[1].trim();

        let nbTab = Math.ceil(totalrow / 20);
        console.log("There is " + totalrow + " results");
        console.log("There is " + nbTab + " tabs");
        for (let t = 0; t < nbTab; t++) {

          if (t > 0) {
            console.log("Switching next tab");
            await this.page.waitForSelector("#ctl00_ContentPlaceHolderContenu_RadGrid1_ctl00 > thead > tr.rgPager > td > div.NumericPagerHolder.Pagination > div > a:nth-child(" + (t + 1) + ")");
            await this.page.click("#ctl00_ContentPlaceHolderContenu_RadGrid1_ctl00 > thead > tr.rgPager > td > div.NumericPagerHolder.Pagination > div > a:nth-child(" + (t + 1) + ")");
            console.log("Wait navigations " + nbTab + " tabs");
            if (t == 10) {
              t = 1;
              nbTab -= 10;
              continue;
            }
          }
          let tmpTotal = 0
          if (totalrow > 20)
            tmpTotal = 20
          else
            tmpTotal = totalrow
          totalrow = totalrow - tmpTotal;
          for (let i = 0; i < tmpTotal; i++) {
            await this.page.waitForSelector("#ctl00_ContentPlaceHolderContenu_RadGrid1_ctl00__" + i + " > td:nth-child(1) > a");
            await this.page.click("#ctl00_ContentPlaceHolderContenu_RadGrid1_ctl00__" + i + " > td:nth-child(1) > a");
            await this.page.waitForSelector('#ctl00_ContentPlaceHolderContenu_FormView1_Ent_AdresseLabel');
            let adress = await this.getAdress();
            let email = await this.getEmail();
            let city = await this.getCity();
            let postalCode = await this.getPostalCode();
            let phone = await this.getPhone();
            let fax = await this.getFax();
            let company = await this.getCompany();
            let listActivities = await this.getActivities();
            console.log(`Extracted ${company} from ${city} email ${email} phone : ${phone}`);
            listOfResult.push([company, adress, postalCode, dep, city, phone, fax, email, activity,listActivities]);
            await this.page.goBack();
            await this.page.waitForSelector('#ctl00_ContentPlaceHolderContenu_RadGrid1_ctl00__0 > td:nth-child(1) > a');


          }
        }

        console.log(`Departement : ${listDep[y]} ended, imported ${listOfResult.length}`);
        const csv = new ObjectsToCsv(listOfResult);
        await csv.toDisk('./exportProspect.csv', {bom: true, append: true})
        listOfResult = [];
        console.log(`Save to file `);
      }
        tmpY = 0;
    }


  },
 async getActivities() {
    let numberActivities = await this.page.$$("#ctl00_ContentPlaceHolderContenu_PanelDetails > div.SG_CContent_StyleSheet > div.SG_CContent_StyleSheet_Right > div > div.SG_CContent_1_2.SG_CContent_Fiche.right > div > ul > li");
let activities = "" ;
    for (let i = 0; i < numberActivities.length; i++) {
      if (i > 0) {
        activities += "|";
      }
      await this.page.waitForSelector("#ctl00_ContentPlaceHolderContenu_FormView1_ListViewActivite_ctrl" + i +"_CoE_NomLabel");
      activities += await this.page.$eval("#ctl00_ContentPlaceHolderContenu_FormView1_ListViewActivite_ctrl" + i +"_CoE_NomLabel", element => element.innerHTML);
     }
    return activities;
 },
  async getAdress() {
    await this.page.waitForSelector("#ctl00_ContentPlaceHolderContenu_FormView1_Ent_AdresseLabel");
    await this.page.waitForSelector("#ctl00_ContentPlaceHolderContenu_FormView1_Ent_AdresseLabel1");
    await this.page.waitForSelector("#ctl00_ContentPlaceHolderContenu_FormView1_Ent_AdresseLabel2");
    let adress = await this.page.$eval('#ctl00_ContentPlaceHolderContenu_FormView1_Ent_AdresseLabel', element => element.innerHTML);
    adress += " " + await this.page.$eval('#ctl00_ContentPlaceHolderContenu_FormView1_Ent_AdresseLabel1', element => element.innerHTML);
    adress += " " + await this.page.$eval('#ctl00_ContentPlaceHolderContenu_FormView1_Ent_AdresseLabel2', element => element.innerHTML);
    adress = adress.trim();
    return adress;
  },

  async getPostalCode() {
    await this.page.waitForSelector("#ctl00_ContentPlaceHolderContenu_FormView1_Ent_CpLabel");
    let postalCode = await this.page.$eval('#ctl00_ContentPlaceHolderContenu_FormView1_Ent_CpLabel', element => element.innerHTML);
    return postalCode
  },

  async getCity() {
    await this.page.waitForSelector("#ctl00_ContentPlaceHolderContenu_FormView1_Ent_VilleLabel");
    let city = await this.page.$eval('#ctl00_ContentPlaceHolderContenu_FormView1_Ent_VilleLabel', element => element.innerHTML);
    return city
  },

  async getPhone() {
    await this.page.waitForSelector("#ctl00_ContentPlaceHolderContenu_FormView1_Ent_TelHyperLink");
    let phone = await this.page.$eval('#ctl00_ContentPlaceHolderContenu_FormView1_Ent_TelHyperLink', element => element.innerHTML);
    return phone
  },
  async getCompany() {
    await this.page.waitForSelector("#ctl00_ContentPlaceHolderContenu_FormView1_Ent_NomLabel");
    let company = await this.page.$eval('#ctl00_ContentPlaceHolderContenu_FormView1_Ent_NomLabel', element => element.innerHTML);
    return company
  },

  async getFax() {
    await this.page.waitForSelector("#ctl00_ContentPlaceHolderContenu_FormView1_Ent_FaxLabel");
    let fax = await this.page.$eval('#ctl00_ContentPlaceHolderContenu_FormView1_Ent_FaxLabel', element => element.innerHTML);
    return fax
  },

  async getEmail() {
    await this.page.waitForSelector("#ctl00_ContentPlaceHolderContenu_FormView1_Ent_EmailHyperLink");
    let email = await this.page.$eval('#ctl00_ContentPlaceHolderContenu_FormView1_Ent_EmailHyperLink', element => element.innerHTML);
    return email
  }
}

module.exports = scraperObject;
