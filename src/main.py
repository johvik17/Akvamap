from fiskeridir import get_sites
from database import save_sites

sites = get_sites()
save_sites(sites)