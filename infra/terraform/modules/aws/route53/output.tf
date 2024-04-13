output "r53_main_zone_id" {
  value = aws_route53_zone.primary.id
}

output "r53_main_zone_name" {
  value = aws_route53_zone.primary.name
}
