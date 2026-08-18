import requests

url = "https://api.fiskeridir.no/pub-aqua/api/v1/sites"


start = 0
batch_size = 100
all_sites = []
species = set()


while True:
    params = {
        "range": f"{start}-{start + batch_size - 1}",
        "species-type": "Salmon"
    }

    response = requests.get(url, params=params)
    batch = response.json()

    if len(batch) == 0:
        break

    all_sites.extend(batch)
    start += batch_size

    print(len(all_sites))

unique_site_numbers = set()

for site in all_sites:
    unique_site_numbers.add(site["siteNr"])

print("Totalt:", len(all_sites))
print("Unike lokalitetsnummer:", len(unique_site_numbers))


other_fish_sites = []

for site in all_sites:
    if "SALMON" in site["speciesTypes"] and site["name"].startswith("A"):
        print(site["name"],"-", site["speciesTypes"])

other_fish_sites = sorted(other_fish_sites, key=lambda site: site["name"])
for site in other_fish_sites:
    print(site["name"])