resource "aws_route53_record" "main" {
  for_each = var.custom_records

  name    = each.key
  zone_id = aws_route53_zone.primary.id
  type    = each.value.type != null ? each.value.type : local.default_record_type
  ttl     = each.value.ttl != null ? each.value.ttl : local.default_ttl
  records = each.value.records
}
