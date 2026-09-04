import sys, re

MAP = {
    '"#FFFFFF"': 'ui.surface',
    '"#fff"': 'ui.surface',
    '"#FFF"': 'ui.surface',
    '"#0F172A"': 'ui.ink',
    '"#1C1C1E"': 'ui.ink',
    '"#0f172a"': 'ui.ink',
    '"#1E293B"': 'ui.ink',
    '"#334155"': 'ui.ink',
    '"#475569"': 'ui.muted',
    '"#64748B"': 'ui.muted',
    '"#8E8E93"': 'ui.muted',
    '"#94A3B8"': 'ui.faint',
    '"#CBD5E1"': 'ui.border',
    '"#E2E8F0"': 'ui.border',
    '"#E5E7EB"': 'ui.border',
    '"#EEF1F4"': 'ui.border',
    '"#F1F5F9"': 'ui.field',
    '"#F8FAFC"': 'ui.field',
    '"#F3F4F6"': 'ui.field',
    '"#EA7600"': 'ui.accent',
    '"#F97316"': 'ui.accent',
    '"#FFF7ED"': 'ui.accentSoft',
    '"#FFF4EB"': 'ui.accentSoft',
    '"#FFEDD5"': 'ui.accentSoft',
    '"#FED7AA"': 'ui.accentBorder',
    '"#FDBA74"': 'ui.accentBorder',
    '"#C2410C"': 'ui.accentInk',
    '"#9A3412"': 'ui.accentInkStrong',
    '"#7C2D12"': 'ui.accentInkStrong',
    '"#FFFBEB"': 'ui.amberSoft',
    '"#FEF3C7"': 'ui.amberSoft',
    '"#FDE68A"': 'ui.amberBorder',
    '"#D97706"': 'ui.amber',
    '"#B45309"': 'ui.amber',
    '"#F59E0B"': 'ui.amber',
    '"#ECFDF5"': 'ui.greenSoft',
    '"#D1FAE5"': 'ui.greenSoft',
    '"#A7F3D0"': 'ui.greenBorder',
    '"#6EE7B7"': 'ui.greenBorder',
    '"#059669"': 'ui.green',
    '"#047857"': 'ui.green',
    '"#065F46"': 'ui.green',
    '"#16A34A"': 'ui.green',
    '"#10B981"': 'ui.green',
    '"#22C55E"': 'ui.green',
    '"#FEF2F2"': 'ui.roseSoft',
    '"#FFF1F2"': 'ui.roseSoft',
    '"#FEE2E2"': 'ui.roseSoft',
    '"#FECACA"': 'ui.roseBorder',
    '"#FCA5A5"': 'ui.roseBorder',
    '"#DC2626"': 'ui.rose',
    '"#EF4444"': 'ui.rose',
    '"#B91C1C"': 'ui.rose',
    '"#BE123C"': 'ui.rose',
    '"#E11D48"': 'ui.rose',
    '"#991B1B"': 'ui.rose',
    '"#EFF6FF"': 'ui.blueSoft',
    '"#DBEAFE"': 'ui.blueSoft',
    '"#BFDBFE"': 'ui.blueBorder',
    '"#2563EB"': 'ui.blue',
    '"#3B82F6"': 'ui.blue',
    '"#1D4ED8"': 'ui.blue',
    '"#F5F3FF"': 'ui.violetSoft',
    '"#EDE9FE"': 'ui.violetSoft',
    '"#DDD6FE"': 'ui.violetBorder',
    '"#7C3AED"': 'ui.violet',
    '"#9333EA"': 'ui.violet',
    '"#6366F1"': 'ui.violet',
    '"rgba(15, 23, 42, 0.45)"': 'ui.overlay',
    '"rgba(15, 23, 42, 0.5)"': 'ui.overlay',
    '"rgba(15, 23, 42, 0.55)"': 'ui.overlay',
    '"rgba(15, 23, 42, 0.6)"': 'ui.overlay',
    '"rgba(0, 0, 0, 0.45)"': 'ui.overlay',
    '"rgba(0,0,0,0.45)"': 'ui.overlay',
    '"rgba(234, 118, 0, 0.14)"': 'ui.accentSoft',
    '"rgba(234, 118, 0, 0.12)"': 'ui.accentSoft',
    '"rgba(234, 118, 0, 0.18)"': 'ui.accentSoft',
    '"rgba(22, 163, 74, 0.16)"': 'ui.greenSoft',
    '"rgba(245, 158, 11, 0.18)"': 'ui.amberSoft',
    '"rgba(60, 60, 67, 0.22)"': 'ui.border',
    '"rgba(60, 60, 67, 0.08)"': 'ui.field',
}


def convert(path, extra=None, varname='styles'):
    src = open(path).read()
    marker = f'const {varname} = StyleSheet.create({{'
    i = src.index(marker)
    head = src[:i]
    rest = src[i + len(marker):]
    end = rest.rstrip()
    assert end.endswith('});'), end[-60:]
    inner = end[:-3]
    tail = rest[len(end):]
    mapping = dict(MAP)
    if extra:
        mapping.update(extra)
    for k in sorted(mapping, key=len, reverse=True):
        inner = inner.replace(k, mapping[k])
    ind = '\n'.join('  ' + l if l.strip() else l for l in inner.split('\n'))
    out = (head + f'function create{varname[0].upper()}{varname[1:]}(ui: DriverUi) {{\n'
           + '  return StyleSheet.create({' + ind + '  });\n}\n' + tail.lstrip('\n'))
    open(path, 'w').write(out)


if __name__ == '__main__':
    convert(sys.argv[1], varname=sys.argv[2] if len(sys.argv) > 2 else 'styles')
