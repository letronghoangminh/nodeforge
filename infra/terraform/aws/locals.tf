locals {
  environment = "prod"
  region      = "ap-southeast-1"
  name        = "nodeforge"

  availability_zones = ["ap-southeast-1a", "ap-southeast-1b"]
  cidr_block         = "10.0.0.0/16"
  private_subnets    = ["10.0.0.0/20"]
  public_subnets     = ["10.0.16.0/20", "10.0.32.0/20"]
  single_nat         = true

  dns_zone = "nodeforge.site"
}
