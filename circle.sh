if [ ! -d circleNums ]
then
   mkdir circleNums
fi
rm circleNums/index.html
# Add this line for center guide <line x1="63" y1="0" x2="63" y2="128" style="stroke:rgb(255,127,64);stroke-width:2"/>
for I in {1..99}
do
   cat <<EOF > circleNums/$I.svg
<svg width='128' height='128' viewBox='0 0 128 128' xmlns='http://www.w3.org/2000/svg' version='1.1' >
<circle cx="64" cy="64" r="62" fill="rgb(41, 182, 246)" stroke="transparent" stroke-width="2"/>
<text text-anchor="middle" x="50%" y="50%" dy=".35em" font-family="sans-serif" font-size="90px" fill="white">$I</text>
</svg>
EOF
   echo "<img src=\"$I.svg\" >" >> circleNums/index.html
   svgexport circleNums/$I.svg circleNums/$I.png
done
ls circleNums
