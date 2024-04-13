module "route53" {
  source = "../modules/aws/route53"

  dns_zone    = local.dns_zone
  environment = local.environment
}

module "acm" {
  source = "../modules/aws/acm"

  dns_name         = local.dns_zone
  r53_main_zone_id = module.route53.r53_main_zone_id
}

module "ecs" {
  source = "../modules/aws/ecs"

  name        = local.name
  environment = local.environment
}

# module "vpc" {
#   source = "../modules/aws/vpc"

#   availability_zones = local.availability_zones
#   cidr_block         = local.cidr_block
#   environment        = local.environment
#   name               = "vpc-${module.shared.stack_name}"
#   private_subnets    = local.private_subnets
#   public_subnets     = local.public_subnets
#   single_nat         = true
# }

# module "alb" {
#   source = "../modules/aws/alb"

#   name                = module.shared.stack_name
#   vpc_id              = module.vpc.id
#   public_subnets      = module.vpc.public_subnets
#   environment         = local.environment
#   alb_security_groups = [module.alb.aws_alb_security_group_id]
#   alb_tls_cert_arn    = module.acm.dns_domain_cert_arn
#   health_check_path   = "/health"
#   idle_timeout        = 4000
# }
