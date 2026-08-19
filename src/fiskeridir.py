import requests

url = "https://api.fiskeridir.no/pub-aqua/api/v1/sites"


def get_sites():
    start = 0
    batch_size = 100
    all_sites = []

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

    return all_sites