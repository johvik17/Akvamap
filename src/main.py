from fiskeridir import get_sites
from database import save_sites

print("1: Starter")

sites = get_sites()

print("2: Hentet sites:", len(sites))

save_sites(sites)

print("3: Lagret sites")