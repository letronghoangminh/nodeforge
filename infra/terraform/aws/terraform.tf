terraform {
  backend "s3" {
    bucket = "nodeforge-terraform-state"
    key    = "terraform.tfstate"
    region = "ap-southeast-1"
  }

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.31.0"
    }

    awsutils = {
      source  = "cloudposse/awsutils"
      version = "~> 0.18.1"
    }
  }
}

provider "aws" {
  region = local.region
  default_tags {
    tags = {
      Environment = local.environment
      Owner       = local.name
      CreatedBy   = "terraform"
    }
  }
}

provider "aws" {
  alias  = "ap_southeast_1"
  region = local.region
}

provider "awsutils" {
  region = local.region
}
