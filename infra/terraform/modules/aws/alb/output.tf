output "aws_alb_dns_name" {
  value = aws_lb.main.dns_name
}

output "aws_alb_zone_id" {
  value = aws_lb.main.zone_id
}

output "aws_alb_listener_https_arn" {
  value = aws_alb_listener.https.arn
}

output "aws_alb_security_group_id" {
  value = aws_security_group.alb.id
}

output "aws_alb_arn" {
  value = aws_lb.main.arn
}

