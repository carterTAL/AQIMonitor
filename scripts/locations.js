// Master list of monitored locations.
// Each location has a PRIMARY zip (closest AirNow reporting area) and 1-2
// nearby BACKUP zips used only if the primary returns no live observation.
// AQI is pulled from AirNow's *current observation* endpoint (live, not forecast).

const LOCATIONS = [
  { division: "Badger Building Center",       city: "Sagle",         state: "ID", zip: "83860", backups: ["83864", "83814"] }, // Sandpoint, Coeur d'Alene
  { division: "Badger Building Center",       city: "Post Falls",    state: "ID", zip: "83854", backups: ["83814", "99201"] }, // Coeur d'Alene, Spokane WA
  { division: "Badger Building Center",       city: "Kalispell",     state: "MT", zip: "59901", backups: ["59937", "59912"] }, // Whitefish, Columbia Falls
  { division: "Badger Building Center",       city: "Bonners Ferry", state: "ID", zip: "83805", backups: ["83864", "59923"] }, // Sandpoint, Libby MT
  { division: "Elma Building Center",         city: "Elma",          state: "WA", zip: "98541", backups: ["98520", "98501"] }, // Aberdeen, Olympia
  { division: "Beaverhead Building Center",   city: "Dillon",        state: "MT", zip: "59725", backups: ["59701", "59715"] }, // Butte, Bozeman
  { division: "Best Built Builders Supply",   city: "Orofino",       state: "ID", zip: "83544", backups: ["83501", "83536"] }, // Lewiston, Kamiah
  { division: "Best Built Builders Supply",   city: "Grangeville",   state: "ID", zip: "83530", backups: ["83536", "83544"] }, // Kamiah, Orofino
  { division: "Best Built Builders Supply",   city: "Kamiah",        state: "ID", zip: "83536", backups: ["83544", "83530"] }, // Orofino, Grangeville
  { division: "Best Built Builders Supply",   city: "Lewiston",      state: "ID", zip: "83501", backups: ["99403", "83843"] }, // Clarkston WA, Moscow
  { division: "Browne's Home Center",         city: "Friday Harbor", state: "WA", zip: "98250", backups: ["98221", "98225"] }, // Anacortes, Bellingham
  { division: "Ennis Building Center",        city: "Ennis",         state: "MT", zip: "59729", backups: ["59715", "59701"] }, // Bozeman, Butte
  { division: "Gerretsen Building Supply",    city: "Roseburg",      state: "OR", zip: "97470", backups: ["97479", "97526"] }, // Sutherlin, Grants Pass
  { division: "Harbor Rental and Saw",        city: "Friday Harbor", state: "WA", zip: "98250", backups: ["98221", "98225"] }, // Anacortes, Bellingham
  { division: "Lake Chelan Building Supply",  city: "Chelan",        state: "WA", zip: "98816", backups: ["98831", "98801"] }, // Manson, Wenatchee
  { division: "Lake Chelan Building Supply",  city: "Manson",        state: "WA", zip: "98831", backups: ["98816", "98801"] }, // Chelan, Wenatchee
  { division: "Marson and Marson Lumber",     city: "Leavenworth",   state: "WA", zip: "98826", backups: ["98801", "98815"] }, // Wenatchee, Cashmere
  { division: "Marson and Marson Lumber",     city: "Wenatchee",     state: "WA", zip: "98801", backups: ["98802", "98815"] }, // East Wenatchee, Cashmere
  { division: "Marson and Marson Lumber",     city: "Cle Elum",      state: "WA", zip: "98922", backups: ["98926", "98801"] }, // Ellensburg, Wenatchee
  { division: "Marson and Marson Lumber",     city: "Ephrata",       state: "WA", zip: "98823", backups: ["98837", "98848"] }, // Moses Lake, Quincy
  { division: "Midway Building Supply",       city: "Tonasket",      state: "WA", zip: "98855", backups: ["98841", "98844"] }, // Omak, Oroville
  { division: "Midway Building Supply",       city: "Republic",      state: "WA", zip: "99166", backups: ["98841", "99114"] }, // Omak, Colville
  { division: "Midway Building Supply",       city: "Oroville",      state: "WA", zip: "98844", backups: ["98855", "98841"] }, // Tonasket, Omak
  { division: "Miller's Home Center",         city: "Baker City",    state: "OR", zip: "97814", backups: ["97850", "97914"] }, // La Grande, Ontario
  { division: "Miller's Home Center",         city: "La Grande",     state: "OR", zip: "97850", backups: ["97814", "97801"] }, // Baker City, Pendleton
  { division: "Mount Vernon Building Center", city: "Mount Vernon",  state: "WA", zip: "98273", backups: ["98233", "98225"] }, // Burlington, Bellingham
  { division: "TAL Support Center",           city: "Vancouver",     state: "WA", zip: "98684", backups: ["97201", "98607"] }, // Portland OR, Camas
  { division: "Tum-A-Lum Lumber",             city: "Hood River",    state: "OR", zip: "97031", backups: ["97058", "98672"] }, // The Dalles, White Salmon WA
  { division: "Tum-A-Lum Lumber",             city: "The Dalles",    state: "OR", zip: "97058", backups: ["97031", "97801"] }, // Hood River, Pendleton
  { division: "Tum-A-Lum Lumber",             city: "Pendleton",     state: "OR", zip: "97801", backups: ["97838", "97850"] }, // Hermiston, La Grande
];

module.exports = { LOCATIONS };
